import { NextResponse } from 'next/server'

// Static list of payment methods for now, or fetch from DB if needed
const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash' },
  { id: 'credit_card', name: 'Credit Card' },
  { id: 'debit_card', name: 'Debit Card' },
  { id: 'transfer', name: 'Bank Transfer' }
];

export async function GET(request: Request) {
  return NextResponse.json(PAYMENT_METHODS);
}
