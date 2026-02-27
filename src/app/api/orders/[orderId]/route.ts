import { auth } from '@/auth'
import connectToDatabase from '@/lib/mongodb'
import Order from '@/models/Order'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase();
    const orderData = await Order.findOne({
      _id: params.orderId,
      user_uid: (session.user as any).id
    }).populate('customer_id', 'name email phone');

    if (!orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const orderObject = orderData.toObject();
    const order = {
      ...orderObject,
      id: orderObject._id.toString(),
      customer: orderObject.customer_id
    };

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updateData = await request.json();
    await connectToDatabase();
    
    const order = await Order.findOneAndUpdate(
      { _id: params.orderId, user_uid: (session.user as any).id },
      updateData,
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase();
    const order = await Order.findOneAndDelete({
      _id: params.orderId,
      user_uid: (session.user as any).id
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Order deleted' })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
