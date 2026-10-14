import { NextResponse } from 'next/server';
import { getToken, odoo, TOKEN_COOKIE } from '@/lib/odoo';

export async function POST() {
  const token = await getToken();
  if (token) await odoo('/logout', { method: 'POST', token });
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(TOKEN_COOKIE);
  return response;
}
