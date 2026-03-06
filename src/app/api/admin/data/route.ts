import { NextResponse } from "next/server";
import { dbCustomers, dbProducts, dbOrders, dbTransactions, getAllDocs } from "@/lib/pouchdb";

function jsonToCsv(items: any[]) {
  if (items.length === 0) return "";
  const header = Object.keys(items[0]).join(",");
  const rows = items.map(item => 
    Object.values(item).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(",")
  );
  return [header, ...rows].join("\n");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  let data: any[] = [];
  let filename = `${type || 'export'}.csv`;

  try {
    switch (type) {
      case "customers":
        data = await getAllDocs(dbCustomers);
        break;
      case "products":
        data = await getAllDocs(dbProducts);
        break;
      case "orders":
        data = await getAllDocs(dbOrders);
        break;
      case "transactions":
        data = await getAllDocs(dbTransactions);
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const csv = jsonToCsv(data);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const text = await file.text();
    const rows = text.split("\n").map(row => row.split(","));
    const headers = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1).filter(row => row.length === headers.length);

    const json = dataRows.map(row => {
      const obj: any = {
        _id: new Date().getTime().toString() + Math.random().toString(36).substring(7),
        isArchived: false,
        created_at: new Date()
      };
      headers.forEach((header, i) => {
        const rawVal = row[i].trim().replace(/^"|"$/g, '');
        const numVal = Number(rawVal);
        obj[header] = (!isNaN(numVal) && rawVal !== "") ? numVal : rawVal;
      });
      return obj;
    });

    let targetDb;
    switch (type) {
      case "products": targetDb = dbProducts; break;
      case "customers": targetDb = dbCustomers; break;
      default: return NextResponse.json({ error: "Cannot import into this collection" }, { status: 400 });
    }

    await targetDb.bulkDocs(json);
    return NextResponse.json({ message: `Successfully imported ${json.length} items` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
