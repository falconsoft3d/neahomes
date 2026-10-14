import { NextResponse } from 'next/server';
import { odoo } from '@/lib/odoo';

export async function GET() {
  const res = await odoo('/catalog');
  return NextResponse.json(res.data, { status: res.status });
}
