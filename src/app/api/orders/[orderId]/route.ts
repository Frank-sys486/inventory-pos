import { auth } from '@/auth'
import { dbOrders } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const doc: any = await dbOrders.get(params.orderId);
    
    // Verify user ownership
    if (doc.user_uid !== (session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const updateData = await request.json();
    const existing: any = await dbOrders.get(params.orderId);

    // Verify user ownership
    if (existing.user_uid !== (session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updated = {
      ...existing,
      ...updateData,
    };

    const response = await dbOrders.put(updated);
    return NextResponse.json({ ...updated, _rev: response.rev });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isDeveloperMode = process.env.DEVELOPER_MODE === 'true';

  try {
    const existing: any = await dbOrders.get(params.orderId);

    // Verify user ownership
    if (existing.user_uid !== (session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isDeveloperMode) {
      await dbOrders.remove(existing);
      return NextResponse.json({ message: 'Order permanently deleted' });
    } else {
      existing.isArchived = true;
      await dbOrders.put(existing);
      return NextResponse.json({ message: 'Order archived' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
}
