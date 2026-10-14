import { NextResponse } from 'next/server';
import { stripCaptcha, verifyCaptcha } from '@/lib/captcha';
import { odoo, ROLE_COOKIE, TOKEN_COOKIE, tokenCookieOptions } from '@/lib/odoo';

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}));
  const captchaError = verifyCaptcha({ token: raw.captcha_token, answer: raw.captcha_answer, honeypot: raw.website });
  if (captchaError) return NextResponse.json({ error: captchaError, captcha: true }, { status: 400 });
  const body = stripCaptcha(raw);
  const res = await odoo<{ token: string }>('/register', { method: 'POST', body, client: req });
  if (!res.ok) return NextResponse.json(res.data, { status: res.status });
  const { token, ...rest } = res.data;
  const response = NextResponse.json(rest);
  response.cookies.set(TOKEN_COOKIE, token, tokenCookieOptions);
  response.cookies.delete(ROLE_COOKIE);
  return response;
}
