import { auth } from '@/auth'
import connectToDatabase from '@/lib/mongodb'
import Transaction from '@/models/Transaction'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase();
    const transactionsData = await Transaction.find({
      user_uid: (session.user as any).id,
      status: 'completed'
    }).sort({ created_at: 1 });

    const cashFlow = transactionsData?.reduce((acc, transaction) => {
      const date = new Date(transaction.created_at).toISOString().split('T')[0];
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      if (acc[date]) {
        acc[date] += amount;
      } else {
        acc[date] = amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ cashFlow });
  } catch (error) {
    console.error('Error fetching cash flow data:', error);
    return NextResponse.json({ error: 'Failed to fetch cash flow data' }, { status: 500 });
  }
}
