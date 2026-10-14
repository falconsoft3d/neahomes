import 'server-only';
import { cookies } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';
import type { Catalog, Slide } from './types';

export const TOKEN_COOKIE = 'nea_token';
/** Solo para la interfaz (enlace al CRM); los permisos reales los comprueba Odoo en cada llamada. */
export const ROLE_COOKIE = 'nea_role';

type OdooResult<T> = { ok: boolean; status: number; data: T & { error?: string } };

/** Llamada servidor → Odoo. La URL y la API key nunca llegan al navegador. */
export async function odoo<T = Record<string, unknown>>(
  path: string,
  { method = 'GET', body, token }: { method?: string; body?: unknown; token?: string } = {},
): Promise<OdooResult<T>> {
  const base = process.env.ODOO_URL ?? 'http://localhost:8069';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = process.env.ODOO_API_KEY?.trim();
  if (apiKey) headers['X-Neahomes-Key'] = apiKey;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${base}/neahomes/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({ error: 'Respuesta no válida de Odoo' }));
    // 401 de sesión es normal (token caducado); 401 de API key o cualquier otro fallo se deja en los logs.
    const keyError = typeof data.error === 'string' && data.error.includes('API key');
    if (!res.ok && !(res.status === 401 && token && !keyError)) {
      // Nunca se registra la clave: solo si está configurada y su longitud, para compararla con la de Odoo.
      const keyInfo = apiKey ? `ODOO_API_KEY de ${apiKey.length} caracteres` : 'ODOO_API_KEY no configurada';
      console.error(`[odoo] ${method} ${path} → ${res.status}: ${data.error ?? ''} (ODOO_URL=${base}, ${keyInfo})`);
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // Next.js usa excepciones internas para marcar la página como dinámica: hay que dejarlas pasar.
    unstable_rethrow(err);
    console.error(`[odoo] ${method} ${path} → sin conexión con ${base}:`, err);
    return { ok: false, status: 503, data: { error: 'No se pudo conectar con Odoo' } as T & { error: string } };
  }
}

/** Respuesta binaria (imágenes) desde la API de Odoo. */
export async function odooRaw(path: string): Promise<Response | null> {
  const base = process.env.ODOO_URL ?? 'http://localhost:8069';
  const headers: Record<string, string> = {};
  const apiKey = process.env.ODOO_API_KEY?.trim();
  if (apiKey) headers['X-Neahomes-Key'] = apiKey;
  try {
    return await fetch(`${base}/neahomes/api${path}`, { headers, cache: 'no-store' });
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
}

/** Proxy de una imagen de Odoo: la URL pública lleva ?v=versión, así que se cachea como inmutable. */
export async function imageProxy(odooPath: string, id: string, req: Request): Promise<Response> {
  const width = new URL(req.url).searchParams.get('w') ?? '0';
  if (!/^\d+$/.test(id) || !/^\d+$/.test(width)) return new Response(null, { status: 400 });
  const res = await odooRaw(`${odooPath}/${id}/image?width=${width}`);
  if (!res || !res.ok) return new Response(null, { status: res?.status ?? 503 });
  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function getSlides(): Promise<Slide[]> {
  const res = await odoo<{ slides: Slide[] }>('/slides');
  return res.ok ? res.data.slides : [];
}

export async function getCatalog(): Promise<Catalog | null> {
  const res = await odoo<Catalog>('/catalog');
  return res.ok ? res.data : null;
}

export async function getIsComercial(): Promise<boolean> {
  return (await cookies()).get(ROLE_COOKIE)?.value === 'comercial';
}

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

export const tokenCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

export async function getSettings(): Promise<{ instagram_url: string }> {
  const res = await odoo<{ instagram_url: string }>('/settings');
  return res.ok ? res.data : { instagram_url: '' };
}
