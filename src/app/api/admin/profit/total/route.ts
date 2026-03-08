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

    // Create a product map for cost fallback
    const productMap: Record<string, any> = {};
    products.forEach((p: any) => {
      productMap[p._id || p.id] = p;
    });
    
    let totalRevenue = 0;
    let totalCapital = 0;

    orders.forEach((o: any) => {
      // 1. Filter by status, user, and archive
      const isMatch = o.status === 'completed' && 
                      !o.isArchived && 
                      o.user_uid === user_uid;
      
      if (!isMatch) return;

      // 2. Filter by date
      if (startDate || endDate) {
        const orderDate = new Date(o.created_at);
        if (startDate && orderDate < new Date(startDate)) return;
        if (endDate && orderDate > new Date(endDate)) return;
      }

      totalRevenue += (o.total_amount || o.total || 0);
      
      // 3. Calculate capital from items
      const items = o.items || o.products || [];
      items.forEach((item: any) => {
        const productId = item.product_id || item.id;
        // Fallback: use saved item cost, OR current product cost, OR 0
        const unitCost = item.cost !== undefined ? item.cost : (productMap[productId]?.cost || 0);
        totalCapital += unitCost * (item.quantity || 1);
      });
    });

    return NextResponse.json({ 
      totalRevenue, 
      totalCapital, 
      totalProfit: totalRevenue - totalCapital 
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
