import { auth } from '@/auth'
import connectToDatabase from '@/lib/mongodb'
import Transaction from '@/models/Transaction'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isDeveloperMode = process.env.DEVELOPER_MODE === 'true';

  try {
    await connectToDatabase();
    
    const query: any = { user_uid: (session.user as any).id };
    
    // Hide archived items unless developer mode is active
    if (!isDeveloperMode) {
      query.isArchived = { $ne: true };
    }

    const transactions = await Transaction.find(query)
      .sort({ created_at: -1 });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json();
    await connectToDatabase();
    
    const transaction = await Transaction.create({
      ...data,
      user_uid: (session.user as any).id
    });

    return NextResponse.json(transaction)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
