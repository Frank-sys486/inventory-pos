import { auth } from '@/auth'
import { dbOrders, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orders = await getAllDocs(dbOrders);
    const revenueByCategory: Record<string, number> = {};

    orders
      .filter((o: any) => o.status === 'completed' && !o.isArchived)
      .forEach((o: any) => {
        o.items.forEach((item: any) => {
          const cat = item.category || "Uncategorized";
          revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (item.price * item.quantity);
        });
      });

    return NextResponse.json({ revenueByCategory });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
