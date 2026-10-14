/**
 * Consentimiento de cookies (RGPD + art. 22.2 LSSI, guía de cookies de la AEPD).
 * Las cookies técnicas no necesitan consentimiento; cualquier script analítico o de marketing
 * que se añada en el futuro debe cargarse SOLO si hasConsent('analiticas' | 'marketing') es true
 * y escuchar el evento CONSENT_EVENT para reaccionar a cambios.
 */
export const CONSENT_COOKIE = 'nea_consent';
/** Súbelo si cambian las categorías o la finalidad: se volverá a pedir el consentimiento. */
export const CONSENT_VERSION = 1;
/** La AEPD recomienda renovar el consentimiento como máximo cada 24 meses; usamos 12. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
export const CONSENT_EVENT = 'nea:consent';
export const OPEN_SETTINGS_EVENT = 'nea:cookie-settings';

export type Category = 'analiticas' | 'marketing';
export type Consent = { v: number; date: string } & Record<Category, boolean>;

export const CATEGORIES: { key: Category; title: string; text: string }[] = [
  {
    key: 'analiticas',
    title: 'Analíticas',
    text: 'Medir las visitas y cómo se usa la web para mejorarla. Ahora mismo no usamos ninguna.',
  },
  {
    key: 'marketing',
    title: 'Marketing',
    text: 'Mostrarte publicidad relacionada con tus intereses. Ahora mismo no usamos ninguna.',
  },
];

export function readConsent(): Consent | null {
  try {
    const raw = document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
    if (!raw) return null;
    const consent = JSON.parse(decodeURIComponent(raw.slice(CONSENT_COOKIE.length + 1))) as Consent;
    return consent.v === CONSENT_VERSION ? consent : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: Record<Category, boolean>): Consent {
  const consent: Consent = { v: CONSENT_VERSION, date: new Date().toISOString(), ...choice };
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(consent))}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
  return consent;
}

export function hasConsent(category: Category): boolean {
  return readConsent()?.[category] === true;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
