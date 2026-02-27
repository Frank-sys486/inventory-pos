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
          totalProfit: { 
            $sum: { 
              $cond: [ { $eq: ['$type', 'income'] }, '$amount', { $subtract: [0, '$amount'] } ] 
            } 
          }
        }
      }
    ]);

    const totalProfit = result.length > 0 ? result[0].totalProfit : 0;
    return NextResponse.json({ totalProfit });
  } catch (error) {
    console.error('Error fetching total profit:', error);
    return NextResponse.json({ error: 'Failed to fetch total profit' }, { status: 500 });
  }
}
