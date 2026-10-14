import { NextResponse } from 'next/server';
import { createChallenge } from '@/lib/captcha';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const mode = new URL(req.url).searchParams.get('mode') === 'text' ? 'text' : 'houses';
  return NextResponse.json(createChallenge(mode), { headers: { 'Cache-Control': 'no-store' } });
}
