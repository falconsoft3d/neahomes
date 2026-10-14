import type { Catalog, Selection } from './types';

const KEY = 'neahomes_draft';

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
  } catch {}
}

/** Resuelve una selección contra el catálogo y suma Modelo + Tamaño + Cubierta + Acabado. */
export function resolveSelection(catalog: Catalog, s: Selection | null) {
  if (!s) return null;
  const modelo = catalog.modelos.find((m) => m.id === s.modelo_id);
  const tamano = catalog.tamanos.find((m) => m.id === s.tamano_id);
  const cubierta = catalog.cubiertas.find((m) => m.id === s.cubierta_id);
  const acabado = catalog.acabados.find((m) => m.id === s.acabado_id);
  if (!modelo || !tamano || !cubierta || !acabado) return null;
  const total = modelo.price + tamano.price + cubierta.price + acabado.price;
  return { modelo, tamano, cubierta, acabado, total };
}
