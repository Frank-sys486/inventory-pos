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
        const items = o.items || o.products || [];
        items.forEach((item: any) => {
          // Robust category detection
          const cat = item.category || "Uncategorized";
          const price = item.price || 0;
          const quantity = item.quantity || 0;
          
          revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (price * quantity);
        });
      });

    return NextResponse.json({ revenueByCategory });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
