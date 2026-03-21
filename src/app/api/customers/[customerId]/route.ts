import { auth } from '@/auth'
import { dbCustomers } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const doc: any = await dbCustomers.get(customerId);
    
    // Verify user ownership if needed, or just return
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const updateData = await request.json();
    const existing: any = await dbCustomers.get(customerId);

    const updated = {
      ...existing,
      ...updateData,
    };

    const response = await dbCustomers.put(updated);
    return NextResponse.json({ ...updated, _rev: response.rev });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isDeveloperMode = process.env.DEVELOPER_MODE === 'true';

  try {
    const existing: any = await dbCustomers.get(customerId);

    if (isDeveloperMode) {
      await dbCustomers.remove(existing);
      return NextResponse.json({ message: 'Customer permanently deleted' });
    } else {
      existing.isArchived = true;
      await dbCustomers.put(existing);
      return NextResponse.json({ message: 'Customer archived' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }
}
