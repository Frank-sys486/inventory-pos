import { auth } from '@/auth'
import { dbOrders, dbProducts, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const user_uid = (session.user as any).id;

  try {
    const [orders, products] = await Promise.all([
      getAllDocs(dbOrders),
      getAllDocs(dbProducts)
    ]);

    // Create a product map for category fallback
    const productMap: Record<string, any> = {};
    products.forEach((p: any) => {
      productMap[p._id || p.id] = p;
    });

    const revenueByCategory: Record<string, number> = {};

    orders
      .filter((o: any) => {
        const isCompleted = o.status === 'completed' && !o.isArchived;
        const isUserMatch = o.user_uid === user_uid;
        if (!isCompleted || !isUserMatch) return false;
        
        if (startDate || endDate) {
          const orderDate = new Date(o.created_at);
          if (startDate && orderDate < new Date(startDate)) return false;
          if (endDate && orderDate > new Date(endDate)) return false;
        }
        return true;
      })
      .forEach((o: any) => {
        const items = o.items || o.products || [];
        items.forEach((item: any) => {
          // Robust category detection
          const productId = item.product_id || item.id;
          const cat = item.category || productMap[productId]?.category || "Uncategorized";
          const price = item.price || 0;
          const quantity = item.quantity || 1;
          
          revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (price * quantity);
        });
      });

    return NextResponse.json({ revenueByCategory });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
