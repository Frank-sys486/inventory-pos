import { auth } from '@/auth'
import connectToDatabase from '@/lib/mongodb'
import Customer from '@/models/Customer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectToDatabase();
    const customers = await Customer.find({ user_uid: (session.user as any).id });
    return NextResponse.json(customers);
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

    // Sanitize data: remove empty strings for optional fields to avoid unique constraint errors
    if (data.email === "") delete data.email;
    if (data.phone === "") delete data.phone;

    await connectToDatabase();
    
    const customer = await Customer.create({
      ...data,
      user_uid: (session.user as any).id
    });

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
