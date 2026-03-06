import { auth } from '@/auth'
import { dbProducts } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const product = await dbProducts.get(params.productId);
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const updateData = await request.json();
    const existing: any = await dbProducts.get(params.productId);
    
    const updated = {
      ...existing,
      ...updateData,
    };

    const response = await dbProducts.put(updated);
    return NextResponse.json({ ...updated, _rev: response.rev });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isDeveloperMode = process.env.DEVELOPER_MODE === 'true';

  try {
    const existing: any = await dbProducts.get(params.productId);

    if (isDeveloperMode) {
      await dbProducts.remove(existing);
      return NextResponse.json({ message: 'Product permanently deleted' });
    } else {
      existing.isArchived = true;
      await dbProducts.put(existing);
      return NextResponse.json({ message: 'Product archived' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
}
