import type { Catalog, Selection } from './types';

const KEY = 'neahomes_draft';
/** Código del enlace de recomendación (?codigo=): se recuerda 30 días y se envía al registrarse. */
const REF_KEY = 'neahomes_ref';
const REF_DAYS = 30;

export function saveRef(code: string) {
  try {
    localStorage.setItem(REF_KEY, JSON.stringify({ code, at: Date.now() }));
  } catch {}
}

export function loadRef(): string | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const { code, at } = JSON.parse(raw) as { code: string; at: number };
    if (Date.now() - at > REF_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(REF_KEY);
      return null;
    }
    return code || null;
  } catch {
    return null;
  }
}

export function clearRef() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {}
}

/** Id de las condiciones de venta que el usuario aceptó al diseñar (se envía al guardar la cotización). */
const ACCEPT_KEY = 'neahomes_conditions';

export function saveAcceptance(conditionsId: number) {
  try {
    localStorage.setItem(ACCEPT_KEY, String(conditionsId));
  } catch {}
}

export function loadAcceptance(): number | null {
  try {
    const raw = localStorage.getItem(ACCEPT_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(selection: Selection) {
  try {
    localStorage.setItem(KEY, JSON.stringify(selection));
  } catch {}
}

export function loadDraft(): Selection | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Selection) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(ACCEPT_KEY);
  } catch {}
}

/** Resuelve una selección contra el catálogo y suma Modelo + Cubierta + Acabado. */
export function resolveSelection(catalog: Catalog, s: Selection | null) {
  if (!s) return null;
  const modelo = catalog.modelos.find((m) => m.id === s.modelo_id);
  const cubierta = catalog.cubiertas.find((m) => m.id === s.cubierta_id);
  const acabado = catalog.acabados.find((m) => m.id === s.acabado_id);
  if (!modelo || !cubierta || !acabado) return null;
  const total = modelo.price + cubierta.price + acabado.price;
  return { modelo, cubierta, acabado, total };
}
