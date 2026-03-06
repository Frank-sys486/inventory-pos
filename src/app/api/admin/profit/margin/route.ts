import { auth } from '@/auth'
import { dbOrders, dbTransactions, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [orders, transactions] = await Promise.all([
      getAllDocs(dbOrders),
      getAllDocs(dbTransactions)
    ]);

    const dailyData: Record<string, { revenue: number, expense: number }> = {};

    orders.filter((o: any) => o.status === 'completed' && !o.isArchived).forEach((o: any) => {
      const date = new Date(o.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) dailyData[date] = { revenue: 0, expense: 0 };
      dailyData[date].revenue += o.total_amount;
    });

    transactions.filter((t: any) => t.status === 'completed' && !t.isArchived).forEach((t: any) => {
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
