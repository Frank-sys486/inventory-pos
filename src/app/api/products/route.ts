import { auth } from '@/auth'
import { dbProducts, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await getAllDocs(dbProducts);
    // Filter non-archived products
    const filtered = products.filter((p: any) => !p.isArchived);
    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json();
    const newProduct = {
      _id: new Date().getTime().toString(), // Simple ID generation
      ...data,
      isArchived: false,
      created_at: new Date()
    };

    const response = await dbProducts.put(newProduct);
    return NextResponse.json({ ...newProduct, _rev: response.rev })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
