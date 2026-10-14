import type { Catalog, Selection } from './types';

const KEY = 'neahomes_draft';
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
