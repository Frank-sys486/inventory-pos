import { NextResponse } from "next/server";
import connectMongoDB from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Transaction from "@/models/Transaction";

// Helper to convert JSON to CSV
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

  await connectMongoDB();

  let data: any[] = [];
  let filename = "export.csv";

  switch (type) {
    case "customers":
      data = await Customer.find({}).lean();
      filename = "customers.csv";
      break;
    case "products":
      data = await Product.find({}).lean();
      filename = "products.csv";
      break;
    case "orders":
      data = await Order.find({}).lean();
      filename = "orders.csv";
      break;
    case "transactions":
      data = await Transaction.find({}).lean();
      filename = "transactions.csv";
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
      const obj: any = {};
      headers.forEach((header, i) => {
        const rawVal = row[i].trim().replace(/^"|"$/g, '');
        // Basic type conversion
        const numVal = Number(rawVal);
        obj[header] = (!isNaN(numVal) && rawVal !== "") ? numVal : rawVal;
      });
      return obj;
    });

    await connectMongoDB();

    switch (type) {
      case "products":
        await Product.insertMany(json);
        break;
      case "customers":
        await Customer.insertMany(json);
        break;
      // Add other cases as needed
    }

    return NextResponse.json({ message: `Successfully imported ${json.length} items` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
