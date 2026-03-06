import { auth } from '@/auth'
import { dbOrders, dbProducts, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const docs = await getAllDocs(dbOrders);
    // Filter by user and archive status
    const filtered = docs.filter((d: any) => 
      d.user_uid === (session.user as any).id && !d.isArchived
    );
    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await request.json();
    const newDoc = {
      _id: new Date().getTime().toString(),
      ...data,
      user_uid: (session.user as any).id,
      isArchived: false,
      created_at: new Date()
    };

    // Save the order
    const orderResponse = await dbOrders.put(newDoc);

    // Deduct stock for each product in the order
    if (data.products && Array.isArray(data.products)) {
      for (const item of data.products) {
        try {
          const productDoc: any = await dbProducts.get(item.id.toString());
          const updatedProduct = {
            ...productDoc,
            in_stock: (productDoc.in_stock || 0) - item.quantity,
          };
          await dbProducts.put(updatedProduct);
        } catch (err) {
          console.error(`Failed to update stock for product ${item.id}:`, err);
          // We continue with other products even if one fails
        }
      }
    }

    return NextResponse.json({ ...newDoc, _rev: orderResponse.rev })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
