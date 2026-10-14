import { NextResponse } from 'next/server';
import { getToken, odoo } from '@/lib/odoo';

// Vercel limita el cuerpo de las peticiones a ~4,5 MB: el máximo por archivo es 4 MB.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Selecciona un archivo.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'El archivo supera el máximo de 4 MB.' }, { status: 400 });
  }
  const data = Buffer.from(await file.arrayBuffer()).toString('base64');
  const res = await odoo('/documents', { method: 'POST', body: { name: file.name, data }, token });
  return NextResponse.json(res.data, { status: res.status });
}
