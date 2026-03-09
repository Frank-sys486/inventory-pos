import { NextResponse } from "next/server";
import { dbCustomers, dbProducts, dbOrders, dbTransactions, getAllDocs } from "@/lib/pouchdb";
import { auth } from "@/auth";

/**
 * Robust JSON to CSV converter
 */
function jsonToCsv(items: any[], type: string) {
  if (items.length === 0) return "";
  
  let headers: string[] = [];
  if (type === "products") {
    headers = ["code", "name", "description", "cost", "price", "in_stock", "category", "unit", "isArchived", "created_at"];
  } else if (type === "customers") {
    headers = ["name", "email", "phone", "address", "isArchived", "created_at"];
  } else {
    headers = Object.keys(items[0]).filter(k => k !== "_rev" && k !== "user_uid");
  }

  const rows = items.map(item => {
    return headers.map(header => {
      const val = item[header];
      if (val === undefined || val === null) return '""';
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
      return val;
    }).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * EXPORT DATA
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user_uid = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    let data: any[] = [];
    switch (type) {
      case "customers": data = await getAllDocs(dbCustomers); break;
      case "products": data = await getAllDocs(dbProducts); break;
      case "orders": data = await getAllDocs(dbOrders); break;
      case "transactions": data = await getAllDocs(dbTransactions); break;
      default: return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const filteredData = data.filter((d: any) => d.user_uid === user_uid);
    const csv = jsonToCsv(filteredData, type || "export");
    
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${type}_export.csv`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * IMPORT DATA
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user_uid = (session.user as any).id;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const mode = formData.get("mode") as string; // "add" or "replace"

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return NextResponse.json({ error: "File is empty" }, { status: 400 });

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Fetch existing items for similarity check and replacement
    let targetDb;
    switch (type) {
      case "products": targetDb = dbProducts; break;
      case "customers": targetDb = dbCustomers; break;
      default: return NextResponse.json({ error: "Import not supported" }, { status: 400 });
    }

    const existingDocs = (await getAllDocs(targetDb)).filter((d: any) => d.user_uid === user_uid && !d.isArchived);
    const existingNames = existingDocs.map((d: any) => d.name.toLowerCase());

    if (mode === "replace") {
      // Archive existing items before importing new ones
      const archiveDocs = existingDocs.map((d: any) => ({ ...d, isArchived: true }));
      await targetDb.bulkDocs(archiveDocs);
    }

    let similarCount = 0;
    const json = lines.slice(1).map(line => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
          values.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current);

      const obj: any = {
        _id: new Date().getTime().toString() + Math.random().toString(36).substring(7),
        isArchived: false,
        created_at: new Date().toISOString(),
        user_uid: user_uid
      };

      headers.forEach((header, i) => {
        if (header === "_rev" || header === "user_uid" || header === "_id") return;
        let val = values[i]?.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
        if (val === undefined || val === "") return;

        if (header === "isArchived") {
          obj.isArchived = (val.toLowerCase() === "true");
          return;
        }

        const numVal = Number(val);
        if (!isNaN(numVal) && val !== "" && !val.startsWith("0")) {
          obj[header] = numVal;
        } else {
          obj[header] = val;
        }
      });

      // Similarity Check
      if (obj.name && existingNames.some(name => {
        const target = obj.name.toLowerCase();
        return name.includes(target) || target.includes(name);
      })) {
        similarCount++;
      }

      return obj;
    });

    await targetDb.bulkDocs(json);

    const similarityPercentage = json.length > 0 ? ((similarCount / json.length) * 100).toFixed(1) : "0";

    return NextResponse.json({ 
      message: `Import Successful`,
      details: {
        total: json.length,
        similar: similarCount,
        similarityPercentage: similarityPercentage,
        mode: mode
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
