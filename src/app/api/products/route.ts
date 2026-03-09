import { auth } from '@/auth'
import { dbProducts, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user_uid = (session.user as any).id;

  try {
    const products = await getAllDocs(dbProducts);
    
    // STRICT FILTER: Hide if isArchived is true (boolean) OR "true" (string)
    const filtered = products.filter((p: any) => {
      const isArchived = p.isArchived === true || p.isArchived === "true";
      return !isArchived && p.user_uid === user_uid;
    });
    
    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user_uid = (session.user as any).id;

  try {
    const data = await request.json();
    const newProduct = {
      _id: new Date().getTime().toString() + Math.random().toString(36).substring(7),
      ...data,
      user_uid: user_uid,
      isArchived: false,
      created_at: new Date().toISOString()
    };

    const response = await dbProducts.put(newProduct);
    return NextResponse.json({ ...newProduct, _rev: response.rev })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
