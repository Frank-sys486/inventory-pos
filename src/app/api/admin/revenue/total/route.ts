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
          status: 'completed',
          type: 'income'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;
    return NextResponse.json({ totalRevenue });
  } catch (error) {
    console.error('Error fetching total revenue:', error);
    return NextResponse.json({ error: 'Failed to fetch total revenue' }, { status: 500 });
  }
}
