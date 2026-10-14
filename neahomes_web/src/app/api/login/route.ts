import { NextResponse } from 'next/server';
import { odoo, ROLE_COOKIE, TOKEN_COOKIE, tokenCookieOptions } from '@/lib/odoo';
import type { Partner } from '@/lib/types';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const res = await odoo<{ token: string; partner: Partner }>('/login', { method: 'POST', body });
  if (!res.ok) return NextResponse.json(res.data, { status: res.status });
  const { token, ...rest } = res.data;
  const response = NextResponse.json(rest);
  response.cookies.set(TOKEN_COOKIE, token, tokenCookieOptions);
  if (rest.partner?.comercial) response.cookies.set(ROLE_COOKIE, 'comercial', tokenCookieOptions);
  else response.cookies.delete(ROLE_COOKIE);
  return response;
}
