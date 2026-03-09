import { NextResponse } from 'next/server'

// Static list of payment methods for now, or fetch from DB if needed
const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash' },
  { id: 'ewallet', name: 'E-wallet' },
  { id: 'transfer', name: 'Bank Transfer' },
  { id: 'credit_card', name: 'Credit Card' },
  { id: 'debit_card', name: 'Debit Card' }
];

export async function GET(request: Request) {
  return NextResponse.json(PAYMENT_METHODS);
}
