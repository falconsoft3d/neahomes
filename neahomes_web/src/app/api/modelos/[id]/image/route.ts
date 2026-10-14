import { odooRaw } from '@/lib/odoo';

type Ctx = { params: Promise<{ id: string }> };

/** Sirve la imagen del modelo desde Odoo. La URL lleva ?v= con la versión, así que se puede cachear sin miedo. */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const width = new URL(req.url).searchParams.get('w') ?? '0';
  if (!/^\d+$/.test(id) || !/^\d+$/.test(width)) return new Response(null, { status: 400 });
  const res = await odooRaw(`/modelo/${id}/image?width=${width}`);
  if (!res || !res.ok) return new Response(null, { status: res?.status ?? 503 });
  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
