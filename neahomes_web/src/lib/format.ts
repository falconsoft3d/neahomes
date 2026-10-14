export function formatPrice(value: number, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency, maximumFractionDigits: 0, useGrouping: 'always' } as Intl.NumberFormatOptions).format(value);
  } catch {
    return `${Math.round(value).toLocaleString('es-ES')} ${currency}`;
  }
}

/** Importe con céntimos (cuotas). */
export function formatMoney(value: number, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' } as Intl.NumberFormatOptions).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatExtra(value: number, currency = 'EUR') {
  return value > 0 ? `+${formatPrice(value, currency)}` : 'Incluido';
}

/** «Entrega desde marzo de 2027»: hoy más los meses de entrega del modelo (vacío si no hay plazo). */
export function deliveryFrom(months: number, today = new Date()) {
  if (!months || months <= 0) return '';
  const d = new Date(today.getFullYear(), today.getMonth() + months, 1);
  return `Entrega desde ${d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
}

export function formatDate(value: string) {
  // Odoo envía fechas ('2026-10-14') o fechas con hora en UTC ('2026-10-14 08:00:00').
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : `${value.replace(' ', 'T')}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
