import { NextResponse } from "next/server";
import { dbCustomers, dbProducts, dbOrders, dbTransactions, getAllDocs, dbUsers } from "@/lib/pouchdb";
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
  } else if (type === "orders") {
    headers = ["_id", "customer_id", "paymentMethod", "total_amount", "amount_received", "change", "status", "items", "created_at"];
  } else if (type === "transactions") {
    headers = ["_id", "type", "amount", "category", "description", "date", "created_at"];
  } else {
    headers = Object.keys(items[0]).filter(k => k !== "_rev" && k !== "user_uid");
  }

  const rows = items.map(item => {
    return headers.map(header => {
      let val = item[header];
      if (val === undefined || val === null) return '""';
      
      // Handle objects/arrays (like items in orders)
      if (typeof val === 'object') {
        val = JSON.stringify(val);
      }
      
      if (typeof val === 'string') {
        return `"${val.replace(/"/g, '""')}"`;
      }
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
    // FULL BACKUP (JSON)
    if (type === "all") {
      const [products, customers, orders, transactions] = await Promise.all([
        getAllDocs(dbProducts),
        getAllDocs(dbCustomers),
        getAllDocs(dbOrders),
        getAllDocs(dbTransactions)
      ]);

      const backup = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        user_uid: user_uid,
        data: {
          products: products.filter((d: any) => d.user_uid === user_uid),
          customers: customers.filter((d: any) => d.user_uid === user_uid),
          orders: orders.filter((d: any) => d.user_uid === user_uid),
          transactions: transactions.filter((d: any) => d.user_uid === user_uid)
        }
      };

      return new NextResponse(JSON.stringify(backup, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=POS_Backup_${new Date().toISOString().split('T')[0]}.json`,
        },
      });
    }

    // INDIVIDUAL CSV EXPORTS
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
    const type = formData.get("type") as string; // products, customers, or "all"
    const mode = formData.get("mode") as string; // "add" or "replace"

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // --- CASE 1: FULL JSON RESTORE ---
    if (type === "all") {
        const text = await file.text();
        const backup = JSON.parse(text);
        
        if (!backup.data || !backup.version) {
            throw new Error("Invalid backup file format");
        }

        const counts = { products: 0, customers: 0, orders: 0, transactions: 0 };

        const processDb = async (db: any, items: any[], dbName: string) => {
            if (!items || items.length === 0) return;
            
            // Clean items: remove _rev, set current user_uid
            const cleanItems = items.map(item => {
                const { _rev, ...rest } = item;
                return { 
                    ...rest, 
                    user_uid: user_uid,
                    _id: rest._id || (new Date().getTime().toString() + Math.random().toString(36).substring(7))
                };
            });

            if (mode === "replace") {
                const existing = await getAllDocs(db);
                const toArchive = existing
                    .filter((d: any) => d.user_uid === user_uid && !d.isArchived)
                    .map((d: any) => ({ ...d, isArchived: true }));
                if (toArchive.length > 0) await db.bulkDocs(toArchive);
            }

            await db.bulkDocs(cleanItems);
            (counts as any)[dbName] = cleanItems.length;
        };

        await processDb(dbProducts, backup.data.products, "products");
        await processDb(dbCustomers, backup.data.customers, "customers");
        await processDb(dbOrders, backup.data.orders, "orders");
        await processDb(dbTransactions, backup.data.transactions, "transactions");

        return NextResponse.json({ 
            message: "Full System Restore Successful",
            details: counts
        });
    }

    // --- CASE 2: INDIVIDUAL CSV IMPORT ---
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return NextResponse.json({ error: "File is empty" }, { status: 400 });

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
    
    let targetDb;
    switch (type) {
      case "products": targetDb = dbProducts; break;
      case "customers": targetDb = dbCustomers; break;
      case "orders": targetDb = dbOrders; break;
      case "transactions": targetDb = dbTransactions; break;
      default: return NextResponse.json({ error: "Import type not supported for CSV" }, { status: 400 });
    }

    const existingDocs = (await getAllDocs(targetDb)).filter((d: any) => d.user_uid === user_uid && !d.isArchived);
    const existingNames = existingDocs.map((d: any) => (d.name || d._id).toLowerCase());

    if (mode === "replace") {
      const archiveDocs = existingDocs.map((d: any) => ({ ...d, isArchived: true }));
      if (archiveDocs.length > 0) await targetDb.bulkDocs(archiveDocs);
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
        if (header === "_rev" || header === "user_uid" || (header === "_id" && !values[i])) return;
        const val = values[i]?.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
        if (val === undefined || val === "") return;

        if (header === "_id") { obj._id = val; return; }
        if (header === "isArchived") { obj.isArchived = (val.toLowerCase() === "true"); return; }

        // Attempt to parse JSON (for items in orders)
        if (val.startsWith("[") || val.startsWith("{")) {
            try {
                obj[header] = JSON.parse(val);
                return;
            } catch (e) {}
        }

        const numVal = Number(val);
        if (!isNaN(numVal) && val !== "" && !val.startsWith("0")) {
          obj[header] = numVal;
        } else {
          obj[header] = val;
        }
      });

      if (obj.name && existingNames.some(name => {
        const target = obj.name.toLowerCase();
        return name.includes(target) || target.includes(name);
      })) {
        similarCount++;
      }

      return obj;
    });

    await targetDb.bulkDocs(json);

    return NextResponse.json({ 
      message: `Import Successful`,
      details: {
        total: json.length,
        similar: similarCount,
        mode: mode
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PURGE DATA (With Password Verification)
 */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user_uid = (session.user as any).id;
  const user_email = session.user.email;

  try {
    const body = await req.json();
    const { password, type } = body;

    if (!password) return NextResponse.json({ error: "Password is required" }, { status: 400 });

    // 1. Verify Password Robustly
    let isPasswordCorrect = false;

    // A. Check if it's the Master Admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@pos.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (user_uid === "admin-master" || user_email === adminEmail) {
        if (password === adminPassword) {
            isPasswordCorrect = true;
        } else {
            return NextResponse.json({ error: "Incorrect admin password" }, { status: 403 });
        }
    } else {
        // B. Check PouchDB for regular users
        const userResult = await dbUsers.find({
            selector: {
                $or: [
                    { _id: user_uid },
                    { email: user_email }
                ]
            }
        });

        const user = userResult.docs[0] as any;

        if (!user) {
            return NextResponse.json({ error: "User account not found in database" }, { status: 404 });
        }

        if (user.password === password) {
            isPasswordCorrect = true;
        } else {
            return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 403 });
        }
    }

    if (!isPasswordCorrect) {
        return NextResponse.json({ error: "Verification failed" }, { status: 403 });
    }

    // 2. Identify Target Databases
    const targets: { name: string; db: any }[] = [];
    if (type === "all" || type === "products") targets.push({ name: "products", db: dbProducts });
    if (type === "all" || type === "customers") targets.push({ name: "customers", db: dbCustomers });
    if (type === "all" || type === "orders") targets.push({ name: "orders", db: dbOrders });
    if (type === "all" || type === "transactions") targets.push({ name: "transactions", db: dbTransactions });

    if (targets.length === 0) return NextResponse.json({ error: "Invalid purge type" }, { status: 400 });

    const isDevMode = process.env.DEVELOPER_MODE === "true";
    const results: any = {};

    for (const target of targets) {
      const docs = (await getAllDocs(target.db)).filter((d: any) => d.user_uid === user_uid);
      
      if (docs.length === 0) {
        results[target.name] = 0;
        continue;
      }

      if (isDevMode) {
        // PERMANENT DELETE (Developer Mode)
        const deleteDocs = docs.map(d => ({ ...d, _deleted: true }));
        await target.db.bulkDocs(deleteDocs);
        results[target.name] = docs.length;
      } else {
        // SOFT DELETE (Archive)
        const archiveDocs = docs.map(d => ({ ...d, isArchived: true }));
        await target.db.bulkDocs(archiveDocs);
        results[target.name] = docs.length;
      }
    }

    return NextResponse.json({ 
      message: isDevMode ? "Data permanently deleted" : "Data moved to archive",
      results
    });

  } catch (error: any) {
    console.error("Purge Error:", error);
    return NextResponse.json({ error: "Server error: " + error.message }, { status: 500 });
  }
}
