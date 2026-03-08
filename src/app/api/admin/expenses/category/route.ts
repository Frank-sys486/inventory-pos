import { auth } from '@/auth'
import { dbTransactions, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const user_uid = (session.user as any).id;

  try {
    const transactions = await getAllDocs(dbTransactions);
    const expensesByCategory: Record<string, number> = {};

    transactions
      .filter((t: any) => {
        const isMatch = t.type === 'expense' && t.status === 'completed' && !t.isArchived && t.user_uid === user_uid;
        if (!isMatch) return false;
        
        if (startDate || endDate) {
          const txDate = new Date(t.created_at);
          if (startDate && txDate < new Date(startDate)) return false;
          if (endDate && txDate > new Date(endDate)) return false;
        }
        return true;
      })
      .forEach((t: any) => {
        const cat = t.category || "General";
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount;
      });

    return NextResponse.json({ expensesByCategory });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
