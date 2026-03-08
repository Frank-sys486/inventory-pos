import { auth } from '@/auth'
import { dbOrders, dbProducts, dbCustomers, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orders = await getAllDocs(dbOrders);
    const customers = await getAllDocs(dbCustomers);
    
    // Create a map for fast customer lookup
    const customerMap: Record<string, any> = {};
    customers.forEach((c: any) => {
      customerMap[c._id || c.id] = c;
    });

    // Filter by user and archive status, and attach customer info
    const enrichedOrders = orders
      .filter((d: any) => d.user_uid === (session.user as any).id && !d.isArchived)
      .map((o: any) => ({
        ...o,
        // Aligment: ensure total_amount and customer_id are set regardless of how they were saved
        total_amount: o.total_amount || o.total || 0,
        customer_id: o.customer_id || o.customerId,
        customer: customerMap[o.customer_id || o.customerId] || { name: 'Unknown Customer' }
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(enrichedOrders);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await request.json();
    
    // Normalize data structure
    const orderData = {
      ...data,
      total_amount: data.total_amount || data.total || 0,
      customer_id: data.customer_id || data.customerId,
      items: data.items || data.products || []
    };

    const newDoc = {
      _id: new Date().getTime().toString(),
      ...orderData,
      user_uid: (session.user as any).id,
      isArchived: false,
      created_at: new Date()
    };

    // Save the order
    const orderResponse = await dbOrders.put(newDoc);

    // Deduct stock for each item in the order
    const items = orderData.items;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        try {
          const productId = item.product_id || item.id;
          if (!productId) continue;

          const productDoc: any = await dbProducts.get(productId.toString());
          const updatedProduct = {
            ...productDoc,
            in_stock: (productDoc.in_stock || 0) - item.quantity,
          };
          await dbProducts.put(updatedProduct);
        } catch (err) {
          console.error(`Failed to update stock for item:`, err);
        }
      }
    }

    return NextResponse.json({ ...newDoc, _rev: orderResponse.rev })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
