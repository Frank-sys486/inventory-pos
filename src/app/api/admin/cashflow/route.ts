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

    const cashFlow: Record<string, number> = {};

    orders.filter((o: any) => o.status === 'completed' && !o.isArchived).forEach((o: any) => {
      const date = new Date(o.created_at).toISOString().split('T')[0];
      cashFlow[date] = (cashFlow[date] || 0) + o.total_amount;
    });

    transactions.filter((t: any) => t.status === 'completed' && !t.isArchived).forEach((t: any) => {
      const date = new Date(t.created_at).toISOString().split('T')[0];
      const amount = t.type === 'income' ? t.amount : -t.amount;
      cashFlow[date] = (cashFlow[date] || 0) + amount;
    });

    return NextResponse.json({ cashFlow });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
