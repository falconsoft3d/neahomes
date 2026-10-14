import { NextResponse } from 'next/server';
import { getToken, odoo } from '@/lib/odoo';

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Inicia sesión para comentar.' }, { status: 401 });
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const res = await odoo(`/blog/${encodeURIComponent(slug)}/comments`, { method: 'POST', body, token });
  return NextResponse.json(res.data, { status: res.status });
}
