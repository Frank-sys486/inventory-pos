import { auth } from '@/auth'
import connectToDatabase from '@/lib/mongodb'
import Transaction from '@/models/Transaction'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase();
    const transaction = await Transaction.findOne({
      _id: params.transactionId,
      user_uid: (session.user as any).id
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updateData = await request.json();
    await connectToDatabase();
    
    const transaction = await Transaction.findOneAndUpdate(
      { _id: params.transactionId, user_uid: (session.user as any).id },
      updateData,
      { new: true }
    );

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isDeveloperMode = process.env.DEVELOPER_MODE === 'true';

  try {
    await connectToDatabase();
    
    let transaction;
    if (isDeveloperMode) {
      // Permanent hard delete
      transaction = await Transaction.findOneAndDelete({
        _id: params.transactionId,
        user_uid: (session.user as any).id
      });
    } else {
      // Soft delete / Archive
      transaction = await Transaction.findOneAndUpdate(
        { _id: params.transactionId, user_uid: (session.user as any).id },
        { isArchived: true },
        { new: true }
      );
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: isDeveloperMode ? 'Transaction permanently deleted' : 'Transaction archived' 
    })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
