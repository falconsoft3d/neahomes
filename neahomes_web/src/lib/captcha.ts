import 'server-only';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { captchaHouseSvg } from './captchaHouse';
import type { Forma } from './types';

/**
 * Captcha propio de NeaHomes (sin servicios externos):
 * - Reto visual: «toca todas las casas con cubierta X» entre 6 (de 1 a 3 correctas: acertar al azar < 2 %),
 *   o una pregunta de texto accesible.
 * - La respuesta nunca va al navegador: viaja como hash dentro de un token firmado con HMAC.
 * - El token caduca, exige un tiempo mínimo de respuesta y solo admite un intento (acierte o no).
 * - Además, un campo trampa (honeypot) que las personas no ven y los bots rellenan.
 */

const TTL_MS = 10 * 60 * 1000;
const MIN_MS = 3000;
const SECRET =
  process.env.CAPTCHA_SECRET?.trim() || process.env.ODOO_API_KEY?.trim() || 'neahomes-captcha-dev-secret';
if (SECRET === 'neahomes-captcha-dev-secret' && process.env.NODE_ENV === 'production') {
  console.warn('[captcha] Define CAPTCHA_SECRET (o ODOO_API_KEY) en producción.');
}

const ROOFS: { forma: Forma; label: string }[] = [
  { forma: 'dos_aguas', label: 'a dos aguas' },
  { forma: 'un_agua', label: 'a un agua' },
  { forma: 'plana', label: 'plana' },
  { forma: 'transitable', label: 'transitable (con barandilla)' },
];
const COLORS = ['#23272d', '#b98a5e', '#5b4636', '#6f7d86', '#3f5a4e', '#8a6f5a'];
const NUMBERS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];

// Retos ya usados (por instancia del servidor; el token además caduca a los 10 minutos).
const used = new Map<string, number>();

const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (data: string) => createHmac('sha256', SECRET).update(data).digest('base64url');
const hashAnswer = (nonce: string, answer: string) => sign(`answer:${nonce}:${answer.trim().toLowerCase()}`);

function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Respuesta de varias casas: ids ordenados, para que el orden en que se tocan no importe. */
function answerKey(ids: string[]) {
  return [...ids].sort().join(',');
}

function makeToken(answer: string) {
  const nonce = randomBytes(12).toString('base64url');
  const payload = b64(JSON.stringify({ n: nonce, h: hashAnswer(nonce, answer), t: Date.now() }));
  return `${payload}.${sign(payload)}`;
}

/** Casa en SVG sin pistas: tamaño y color aleatorios, ids aleatorios y nada que nombre la cubierta. */
function houseSvg(forma: Forma) {
  return captchaHouseSvg(forma, 40 + randomInt(6) * 10, COLORS[randomInt(COLORS.length)]);
}

export type Challenge =
  | { mode: 'houses'; token: string; prompt: string; options: { id: string; svg: string }[] }
  | { mode: 'text'; token: string; prompt: string };

export function createChallenge(mode: 'houses' | 'text' = 'houses'): Challenge {
  if (mode === 'text') {
    const a = 1 + randomInt(9);
    const b = 1 + randomInt(9);
    return { mode, token: makeToken(String(a + b)), prompt: `¿Cuánto es ${NUMBERS[a]} más ${NUMBERS[b]}? Escríbelo en números.` };
  }
  const target = ROOFS[randomInt(ROOFS.length)];
  const others = ROOFS.filter((r) => r !== target);
  const correct = 1 + randomInt(3);
  const formas = [
    ...Array.from({ length: correct }, () => target.forma),
    ...Array.from({ length: 6 - correct }, () => others[randomInt(others.length)].forma),
  ];
  const options = shuffle(formas).map((forma) => ({ id: randomBytes(6).toString('hex'), forma }));
  const answer = answerKey(options.filter((o) => o.forma === target.forma).map((o) => o.id));
  return {
    mode,
    token: makeToken(answer),
    prompt: `Toca todas las casas con cubierta ${target.label}.`,
    options: options.map((o) => ({ id: o.id, svg: houseSvg(o.forma) })),
  };
}

/** null si es una persona; si no, el motivo para mostrar. */
export function verifyCaptcha(input: { token?: unknown; answer?: unknown; honeypot?: unknown }): string | null {
  if (typeof input.honeypot === 'string' && input.honeypot.trim()) return 'No se pudo verificar que eres una persona.';
  if (typeof input.token !== 'string' || typeof input.answer !== 'string' || !input.answer.trim()) {
    return 'Completa la verificación antes de enviar.';
  }
  const [payload, signature] = input.token.split('.');
  if (!payload || !signature) return 'La verificación no es válida. Inténtalo de nuevo.';
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return 'La verificación no es válida. Inténtalo de nuevo.';
  }
  let data: { n: string; h: string; t: number };
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return 'La verificación no es válida. Inténtalo de nuevo.';
  }
  const age = Date.now() - data.t;
  if (age > TTL_MS) return 'La verificación ha caducado. Inténtalo de nuevo.';
  if (age < MIN_MS) return 'Has respondido demasiado rápido. Inténtalo de nuevo.';
  for (const [nonce, at] of used) if (Date.now() - at > TTL_MS) used.delete(nonce);
  if (used.has(data.n)) return 'Esta verificación ya se usó. Inténtalo de nuevo.';
  // Un solo intento por reto: así no se puede probar respuesta tras respuesta con el mismo token.
  used.set(data.n, Date.now());
  const answer = input.answer.includes(',') ? answerKey(input.answer.split(',')) : input.answer;
  if (hashAnswer(data.n, answer) !== data.h) return 'La respuesta de la verificación no es correcta.';
  return null;
}

/** Quita del cuerpo los campos del captcha antes de reenviarlo a Odoo. */
export function stripCaptcha<T extends Record<string, unknown>>(body: T) {
  const { captcha_token, captcha_answer, website, ...rest } = body;
  void captcha_token; void captcha_answer; void website;
  return rest;
}
