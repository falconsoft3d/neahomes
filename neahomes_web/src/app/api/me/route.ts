import { NextResponse } from 'next/server';
import { getToken, odoo } from '@/lib/odoo';

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 });
  const res = await odoo('/me', { token });
  return NextResponse.json(res.data, { status: res.status });
}
