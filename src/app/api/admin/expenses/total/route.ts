import { auth } from '@/auth'
import { dbTransactions, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const transactions = await getAllDocs(dbTransactions);
    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense' && t.status === 'completed' && !t.isArchived)
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    return NextResponse.json({ totalExpenses });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
