import { auth } from '@/auth'
import { dbOrders, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orders = await getAllDocs(dbOrders);
    const totalRevenue = orders
      .filter((o: any) => o.status === 'completed' && !o.isArchived)
      .reduce((sum: number, o: any) => sum + (o.total_amount || o.total || 0), 0);

    return NextResponse.json({ totalRevenue });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
