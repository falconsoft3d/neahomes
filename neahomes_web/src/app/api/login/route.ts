import { NextResponse } from 'next/server';
import { odoo, TOKEN_COOKIE, tokenCookieOptions } from '@/lib/odoo';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const res = await odoo<{ token: string }>('/login', { method: 'POST', body });
  if (!res.ok) return NextResponse.json(res.data, { status: res.status });
  const { token, ...rest } = res.data;
  const response = NextResponse.json(rest);
  response.cookies.set(TOKEN_COOKIE, token, tokenCookieOptions);
  return response;
}
