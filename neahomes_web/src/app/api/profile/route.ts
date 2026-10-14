import { NextResponse } from 'next/server';
import { getToken, odoo } from '@/lib/odoo';

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const res = await odoo('/profile', { method: 'POST', body, token });
  return NextResponse.json(res.data, { status: res.status });
}
