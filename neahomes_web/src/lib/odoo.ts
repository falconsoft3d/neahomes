import 'server-only';
import { cookies } from 'next/headers';
import type { Catalog } from './types';

export const TOKEN_COOKIE = 'nea_token';

type OdooResult<T> = { ok: boolean; status: number; data: T & { error?: string } };

/** Llamada servidor → Odoo. La URL y la API key nunca llegan al navegador. */
export async function odoo<T = Record<string, unknown>>(
  path: string,
  { method = 'GET', body, token }: { method?: string; body?: unknown; token?: string } = {},
): Promise<OdooResult<T>> {
  const base = process.env.ODOO_URL ?? 'http://localhost:8069';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.ODOO_API_KEY) headers['X-Neahomes-Key'] = process.env.ODOO_API_KEY;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${base}/neahomes/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({ error: 'Respuesta no válida de Odoo' }));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 503, data: { error: 'No se pudo conectar con Odoo' } as T & { error: string } };
  }
}

/** Respuesta binaria (imágenes) desde la API de Odoo. */
export async function odooRaw(path: string): Promise<Response | null> {
  const base = process.env.ODOO_URL ?? 'http://localhost:8069';
  const headers: Record<string, string> = {};
  if (process.env.ODOO_API_KEY) headers['X-Neahomes-Key'] = process.env.ODOO_API_KEY;
  try {
    return await fetch(`${base}/neahomes/api${path}`, { headers, cache: 'no-store' });
  } catch {
    return null;
  }
}

export async function getCatalog(): Promise<Catalog | null> {
  const res = await odoo<Catalog>('/catalog');
  return res.ok ? res.data : null;
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
