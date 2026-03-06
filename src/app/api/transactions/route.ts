import { auth } from '@/auth'
import { dbTransactions, getAllDocs } from '@/lib/pouchdb'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isDeveloperMode = process.env.DEVELOPER_MODE === 'true';

  try {
    const docs = await getAllDocs(dbTransactions);
    const filtered = docs.filter((d: any) => {
      const isOwner = d.user_uid === (session.user as any).id;
      const isNotArchived = isDeveloperMode ? true : !d.isArchived;
      return isOwner && isNotArchived;
    });
    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await request.json();
    const newDoc = {
      _id: new Date().getTime().toString(),
      ...data,
      user_uid: (session.user as any).id,
      isArchived: false,
      created_at: new Date()
    };

    const response = await dbTransactions.put(newDoc);
    return NextResponse.json({ ...newDoc, _rev: response.rev })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
