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
    
    const result = await Transaction.aggregate([
      {
        $match: {
          user_uid: (session.user as any).id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { 
            $sum: { $cond: [ { $eq: ['$type', 'income'] }, '$amount', 0 ] } 
          },
          totalExpenses: { 
            $sum: { $cond: [ { $eq: ['$type', 'expense'] }, '$amount', 0 ] } 
          }
        }
      }
    ]);

    const stats = result.length > 0 ? result[0] : { totalRevenue: 0, totalExpenses: 0 };
    const totalProfit = stats.totalRevenue - stats.totalExpenses;
    const profitMargin = stats.totalRevenue > 0 ? (totalProfit / stats.totalRevenue) * 100 : 0;

    return NextResponse.json({ profitMargin });
  } catch (error) {
    console.error('Error fetching profit margin:', error);
    return NextResponse.json({ error: 'Failed to fetch profit margin' }, { status: 500 });
  }
}
