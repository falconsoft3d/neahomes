import type { Credit } from './types';

export const CREDIT_NOTE = 'Simulación de crédito orientativa, sujeta a aprobación.';

/** Cuota constante (sistema francés). Misma fórmula que Odoo (models/credito.py). */
export function monthlyPayment(capital: number, tin: number, months: number) {
  if (months <= 0) return 0;
  const r = tin / 100 / 12;
  if (!r) return capital / months;
  return (capital * r) / (1 - (1 + r) ** -months);
}

export function defaultCredit(credits: Credit[]) {
  return credits.find((c) => c.is_default) ?? credits[0] ?? null;
}

export function formatPercent(value: number) {
  return `${value.toLocaleString('es-ES', { maximumFractionDigits: 3 })} %`;
}

export function formatMonths(months: number) {
  const years = months / 12;
  return Number.isInteger(years) ? `${months} meses (${years} ${years === 1 ? 'año' : 'años'})` : `${months} meses`;
}

/** Cuadro de amortización redondeado a céntimos (idéntico al de Odoo). */
export function paymentPlan(capital: number, tin: number, months: number) {
  const r = tin / 100 / 12;
  const cuota = Math.round(monthlyPayment(capital, tin, months) * 100) / 100;
  const round = (n: number) => Math.round(n * 100) / 100;
  let pendiente = round(capital);
  const rows: { mes: number; cuota: number; intereses: number; amortizacion: number; pendiente: number }[] = [];
  for (let mes = 1; mes <= months; mes++) {
    const intereses = round(pendiente * r);
    const amortizacion = mes === months ? round(pendiente) : round(cuota - intereses);
    pendiente = round(pendiente - amortizacion);
    rows.push({ mes, cuota: round(amortizacion + intereses), intereses, amortizacion, pendiente: Math.max(pendiente, 0) });
  }
  return rows;
}

export function financeSummary(capital: number, tin: number, months: number) {
  const rows = paymentPlan(capital, tin, months);
  const total = Math.round(rows.reduce((s, r) => s + r.cuota, 0) * 100) / 100;
  return { cuota: Math.round(monthlyPayment(capital, tin, months) * 100) / 100, total, intereses: Math.round((total - capital) * 100) / 100 };
}
