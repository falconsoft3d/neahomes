import { NextResponse } from 'next/server';
import { odoo } from '@/lib/odoo';

export async function GET(req: Request) {
  const country = new URL(req.url).searchParams.get('country') ?? '';
  if (!/^\d+$/.test(country)) return NextResponse.json({ states: [] });
  const res = await odoo(`/states?country_id=${country}`);
  return NextResponse.json(res.data, { status: res.status });
}
