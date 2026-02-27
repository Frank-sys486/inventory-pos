import { auth } from '@/auth'
import connectToDatabase from '@/lib/mongodb'
import Customer from '@/models/Customer'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase();
    const customer = await Customer.findOne({
      _id: params.customerId,
      user_uid: (session.user as any).id
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updateData = await request.json();
    await connectToDatabase();
    
    const customer = await Customer.findOneAndUpdate(
      { _id: params.customerId, user_uid: (session.user as any).id },
      updateData,
      { new: true }
    );

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase();
    const customer = await Customer.findOneAndDelete({
      _id: params.customerId,
      user_uid: (session.user as any).id
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Customer deleted' })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
