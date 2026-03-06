import { auth } from '@/auth'
import { dbTransactions, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const transactions = await getAllDocs(dbTransactions);
    const expensesByCategory: Record<string, number> = {};

    transactions
      .filter((t: any) => t.type === 'expense' && t.status === 'completed' && !t.isArchived)
      .forEach((t: any) => {
        const cat = t.category || "General";
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount;
      });

    return NextResponse.json({ expensesByCategory });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
