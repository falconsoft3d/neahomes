import { NextResponse } from 'next/server';
import { odoo } from '@/lib/odoo';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const res = await odoo('/contact', { method: 'POST', body });
  return NextResponse.json(res.data, { status: res.status });
}
