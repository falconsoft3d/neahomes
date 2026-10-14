export function formatPrice(value: number, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency, maximumFractionDigits: 0, useGrouping: 'always' } as Intl.NumberFormatOptions).format(value);
  } catch {
    return `${Math.round(value).toLocaleString('es-ES')} ${currency}`;
  }
}

export function formatExtra(value: number, currency = 'EUR') {
  return value > 0 ? `+${formatPrice(value, currency)}` : 'Incluido';
}

export function formatDate(value: string) {
  const d = new Date(value.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
