import { auth } from '@/auth'
import { dbProducts, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const products = await getAllDocs(dbProducts);
    
    // Total Expense = Total Inventory Value (Cost * In Stock)
    const totalExpenses = products
      .filter((p: any) => !p.isArchived)
      .reduce((sum: number, p: any) => sum + ((p.cost || 0) * (p.in_stock || 0)), 0);

    return NextResponse.json({ totalExpenses });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
