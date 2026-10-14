import { CREDIT_NOTE, formatMonths, formatPercent } from '@/lib/credit';
import { formatMoney } from '@/lib/format';
import type { PaymentRow, QuotePayment } from '@/lib/types';

const amount = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Props = { payment: Extract<QuotePayment, { tipo: 'financiado' }>; rows: PaymentRow[]; currency: string };

/** Financiación de una cotización guardada: resumen y cuadro de amortización desplegable. */
export default function PaymentPlan({ payment, rows, currency }: Props) {
  return (
    <div className="quote-finance">
      <p>
        Financiado · <strong>{formatMoney(payment.cuota, currency)}/mes</strong> · {formatMonths(payment.plazo)}
      </p>
      <p className="muted">
        {payment.credito && <>{payment.credito} · </>}TIN {formatPercent(payment.tin)} · TAE {formatPercent(payment.tae)} ·
        intereses {formatMoney(payment.intereses, currency)} · total {formatMoney(payment.total, currency)}
      </p>
      <details className="plan">
        <summary>Ver plan de pagos</summary>
        <p className="plan-currency">Importes en {currency}. Amortización = cuota − intereses.</p>
        <div className="plan-table-wrap">
          <table className="legal-table plan-table">
            <thead>
              <tr><th>Mes</th><th>Cuota</th><th>Intereses</th><th>Pendiente</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.mes}>
                  <td>{r.mes}</td>
                  <td>{amount(r.cuota)}</td>
                  <td>{amount(r.intereses)}</td>
                  <td>{amount(r.pendiente)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="fine">{CREDIT_NOTE}</p>
    </div>
  );
}
