import { NextResponse } from 'next/server';
import { getToken, odoo } from '@/lib/odoo';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Ticket no válido' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const res = await odoo(`/tickets/${id}/reply`, { method: 'POST', body, token });
  return NextResponse.json(res.data, { status: res.status });
}
