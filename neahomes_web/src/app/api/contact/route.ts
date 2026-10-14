import { NextResponse } from 'next/server';
import { stripCaptcha, verifyCaptcha } from '@/lib/captcha';
import { odoo } from '@/lib/odoo';

export async function POST(req: Request) {
  const raw = await req.json().catch(() => ({}));
  const captchaError = verifyCaptcha({ token: raw.captcha_token, answer: raw.captcha_answer, honeypot: raw.website });
  if (captchaError) return NextResponse.json({ error: captchaError, captcha: true }, { status: 400 });
  const res = await odoo('/contact', { method: 'POST', body: stripCaptcha(raw) });
  return NextResponse.json(res.data, { status: res.status });
}
