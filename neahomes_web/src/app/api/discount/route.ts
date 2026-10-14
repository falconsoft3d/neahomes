import { NextResponse } from 'next/server';
import { odoo } from '@/lib/odoo';

export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get('code') ?? '').trim().slice(0, 64);
  if (!code) return NextResponse.json({ error: 'Escribe un código.' }, { status: 400 });
  const res = await odoo(`/discount?code=${encodeURIComponent(code)}`);
  return NextResponse.json(res.data, { status: res.status });
}
