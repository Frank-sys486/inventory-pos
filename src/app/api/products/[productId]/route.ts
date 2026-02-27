import { auth } from '@/auth'
import connectToDatabase from '@/lib/mongodb'
import Product from '@/models/Product'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase();
    const product = await Product.findOne({
      _id: params.productId,
      user_uid: (session.user as any).id
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { code, name, description, price, cost, in_stock, category, unit } = await request.json();
    await connectToDatabase();
    
    const updateFields: any = {
      name,
      description,
      price,
      cost,
      in_stock,
      category,
      unit,
    };

    if (code !== undefined) {
      updateFields.code = code;
    }

    const product = await Product.findOneAndUpdate(
      { _id: params.productId, user_uid: (session.user as any).id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase();
    const product = await Product.findOneAndDelete({
      _id: params.productId,
      user_uid: (session.user as any).id
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product deleted' })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
