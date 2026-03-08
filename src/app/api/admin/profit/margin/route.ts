import { auth } from '@/auth'
import { dbOrders, dbTransactions, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const user_uid = (session.user as any).id;

  try {
    const [orders, transactions] = await Promise.all([
      getAllDocs(dbOrders),
      getAllDocs(dbTransactions)
    ]);

    const dailyData: Record<string, { revenue: number, expense: number }> = {};

    orders
      .filter((o: any) => {
        const isMatch = o.status === 'completed' && !o.isArchived && o.user_uid === user_uid;
        if (!isMatch) return false;
        if (startDate || endDate) {
          const orderDate = new Date(o.created_at);
          if (startDate && orderDate < new Date(startDate)) return false;
          if (endDate && orderDate > new Date(endDate)) return false;
        }
        return true;
      })
      .forEach((o: any) => {
        const date = new Date(o.created_at).toISOString().split('T')[0];
        if (!dailyData[date]) dailyData[date] = { revenue: 0, expense: 0 };
        dailyData[date].revenue += (o.total_amount || o.total || 0);
      });

    transactions
      .filter((t: any) => {
        const isMatch = t.status === 'completed' && !t.isArchived && t.user_uid === user_uid;
        if (!isMatch) return false;
        if (startDate || endDate) {
          const txDate = new Date(t.created_at);
          if (startDate && txDate < new Date(startDate)) return false;
          if (endDate && txDate > new Date(endDate)) return false;
        }
        return true;
      })
      .forEach((t: any) => {
        const date = new Date(t.created_at).toISOString().split('T')[0];
        if (!dailyData[date]) dailyData[date] = { revenue: 0, expense: 0 };
        if (t.type === 'income') dailyData[date].revenue += t.amount;
        else dailyData[date].expense += t.amount;
      });

    const profitMargin = Object.entries(dailyData).map(([date, data]) => ({
      date,
      margin: data.revenue - data.expense
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ profitMargin });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
