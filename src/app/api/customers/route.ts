import { auth } from '@/auth'
import { dbCustomers, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user_uid = (session.user as any).id;

  try {
    const docs = await getAllDocs(dbCustomers);
    const filtered = docs.filter((d: any) => !d.isArchived && d.user_uid === user_uid);
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
    const newDoc = {
      _id: new Date().getTime().toString() + Math.random().toString(36).substring(7),
      ...data,
      user_uid: user_uid,
      isArchived: false,
      created_at: new Date()
    };

    const response = await dbCustomers.put(newDoc);
    return NextResponse.json({ ...newDoc, _rev: response.rev })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
