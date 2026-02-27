import { auth } from '@/auth'
import connectToDatabase from '@/lib/mongodb'
import Order from '@/models/Order'
import Transaction from '@/models/Transaction'
import Product from '@/models/Product'
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase()
    const ordersData = await Order.find({
      user_uid: (session.user as any).id,
    })
      .populate('customer_id', 'name')
      .sort({ created_at: -1 })

    const orders = ordersData.map((order) => {
      const orderObject = order.toObject()
      return {
        ...orderObject,
        id: orderObject._id.toString(), // Convert ObjectId to string
        customer: orderObject.customer_id, // Rename customer_id to customer
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { customerId, paymentMethod, products, total } = await request.json();
  const userId = (session.user as any).id;

  try {
    await connectToDatabase();
    
    // 1. Create the Order with embedded items
    // Note: Transactions removed for compatibility with standalone MongoDB instances
    const order = await Order.create({
      customer_id: customerId,
      total_amount: total,
      user_uid: userId,
      status: 'completed',
      items: products.map((p: any) => ({
        product_id: p.id,
        name: p.name, 
        quantity: p.quantity,
        price: p.price
      }))
    });

    // 2. Create the Transaction record
    await Transaction.create({
      order_id: order._id,
      payment_method: paymentMethod || 'Cash',
      amount: total,
      user_uid: userId,
      status: 'completed',
      category: 'selling',
      type: 'income',
      description: `Payment for order #${order._id}`
    });

    // 3. Update product stock
    for (const item of products) {
      await Product.updateOne(
        { _id: item.id },
        { $inc: { in_stock: -item.quantity } }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
