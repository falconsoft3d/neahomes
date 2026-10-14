import 'server-only';
import { cookies } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';
import type { Catalog, Conditions, Slide } from './types';

export const TOKEN_COOKIE = 'nea_token';
/** Solo para la interfaz (enlace al CRM); los permisos reales los comprueba Odoo en cada llamada. */
export const ROLE_COOKIE = 'nea_role';

type OdooResult<T> = { ok: boolean; status: number; data: T & { error?: string } };

/** Llamada servidor → Odoo. La URL y la API key nunca llegan al navegador. */
export async function odoo<T = Record<string, unknown>>(
  path: string,
  { method = 'GET', body, token, client }: { method?: string; body?: unknown; token?: string; client?: Request } = {},
): Promise<OdooResult<T>> {
  const base = process.env.ODOO_URL ?? 'http://localhost:8069';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = process.env.ODOO_API_KEY?.trim();
  if (apiKey) headers['X-Neahomes-Key'] = apiKey;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (client) Object.assign(headers, clientHeaders(client));
  try {
    const res = await fetch(`${base}/neahomes/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    const text = await res.text();
    let data: T & { error?: string };
    try {
      data = JSON.parse(text);
    } catch {
      // Odoo devolvió HTML (normalmente una página de error): se registra el principio para poder diagnosticarlo.
      console.error(`[odoo] ${method} ${path} → ${res.status} sin JSON: ${text.replace(/\s+/g, ' ').slice(0, 300)}`);
      data = { error: `Respuesta no válida de Odoo (HTTP ${res.status})` } as T & { error: string };
    }
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

/** IP y navegador del cliente para el registro de aceptación de las condiciones de venta. */
function clientHeaders(req: Request): Record<string, string> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '';
  const ua = req.headers.get('user-agent') || '';
  return { ...(ip && { 'X-Neahomes-Client-IP': ip }), ...(ua && { 'X-Neahomes-Client-UA': ua.slice(0, 255) }) };
}

export async function getConditions(): Promise<Conditions | null> {
  const res = await odoo<{ conditions: Conditions | null }>('/conditions');
  return res.ok ? res.data.conditions : null;
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

export type Legal = { company: string; nif: string; address: string; email: string };
export type Settings = { instagram_url: string; legal: Legal };

export async function getSettings(): Promise<Settings> {
  const res = await odoo<Settings>('/settings');
  const empty: Legal = { company: '', nif: '', address: '', email: '' };
  return res.ok ? { ...res.data, legal: { ...empty, ...res.data.legal } } : { instagram_url: '', legal: empty };
}
