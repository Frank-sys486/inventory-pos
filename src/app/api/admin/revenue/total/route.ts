import { auth } from '@/auth'
import { dbOrders, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const user_uid = (session.user as any).id;

  try {
    const orders = await getAllDocs(dbOrders);
    const totalRevenue = orders
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
      .reduce((sum: number, o: any) => sum + (o.total_amount || o.total || 0), 0);

    return NextResponse.json({ totalRevenue });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
