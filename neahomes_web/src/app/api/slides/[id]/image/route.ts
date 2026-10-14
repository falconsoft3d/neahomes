import { imageProxy } from '@/lib/odoo';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  return imageProxy('/slide', (await params).id, req);
}
