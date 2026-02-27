import { auth } from '@/auth'
import connectToDatabase from '@/lib/mongodb'
import Transaction from '@/models/Transaction'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const expensesData = await Transaction.find({
      user_uid: (session.user as any).id,
      status: 'completed',
      type: 'expense'
    });

    const expensesByCategory = expensesData?.reduce((acc, item) => {
      const category = item.category;
      if (!category) return acc;
      
      const amount = item.amount;
      if (acc[category]) {
        acc[category] += amount;
      } else {
        acc[category] = amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ expensesByCategory });
  } catch (error) {
    console.error('Error fetching expenses by category:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses by category' }, { status: 500 });
  }
}
