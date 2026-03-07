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

    const totalRevenue = orders
      .filter((o: any) => o.status === 'completed' && !o.isArchived)
      .reduce((sum: number, o: any) => sum + (o.total_amount || o.total || 0), 0);

    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense' && t.status === 'completed' && !t.isArchived)
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    return NextResponse.json({ totalProfit: totalRevenue - totalExpenses });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
