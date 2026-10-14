'use client';

import Link from 'next/link';
import HouseIllustration from './HouseIllustration';
import ModeloPhoto from './ModeloPhoto';
import { CREDIT_NOTE, financeSummary } from '@/lib/credit';
import { formatExtra, formatMoney, formatPrice } from '@/lib/format';
import { resolveSelection } from '@/lib/draft';
import type { Catalog, Selection } from '@/lib/types';

export default function QuoteSummary({ catalog, draft }: { catalog: Catalog; draft: Selection | null }) {
  const r = resolveSelection(catalog, draft);
  const cur = catalog.currency;
  const pago = draft?.pago;
  const total = r ? Math.max(r.total - (draft?.descuento_importe ?? 0), 0) : 0;
  const credit = pago?.tipo === 'financiado' ? (catalog.creditos ?? []).find((c) => c.id === pago.credito_id) : undefined;
  if (!r) {
    return (
      <div className="summary-card">
        <h2>Tu casa</h2>
        <p className="muted">Aún no has diseñado tu casa. Puedes crear la cuenta ahora y diseñarla después.</p>
        <Link href="/encargar" className="btn btn-light">Diseñar mi casa</Link>
      </div>
    );
  }
  return (
    <div className="summary-card">
      {r.modelo.image_version > 0 ? (
        <ModeloPhoto id={r.modelo.id} version={r.modelo.image_version} alt={r.modelo.name} width={800} />
      ) : (
        <HouseIllustration m2={r.modelo.m2 || 70} forma={r.cubierta.forma} color={r.acabado.color} showDimension={false} />
      )}
      <h2>{r.modelo.name}</h2>
      <dl>
        <div><dt>{r.modelo.name}{r.modelo.m2 ? ` · ${r.modelo.m2} m²` : ''}</dt><dd>{formatPrice(r.modelo.price, cur)}</dd></div>
        <div><dt>Cubierta {r.cubierta.name.toLowerCase()}</dt><dd>{formatExtra(r.cubierta.price, cur)}</dd></div>
        <div><dt>Acabado {r.acabado.name.toLowerCase()}</dt><dd>{formatExtra(r.acabado.price, cur)}</dd></div>
        {r.modelo.distribuciones
          .filter((d) => (draft?.distribuciones?.[d.id] ?? 0) > 0)
          .map((d) => (
            <div key={d.id}><dt>{d.name}</dt><dd>× {draft?.distribuciones?.[d.id]}</dd></div>
          ))}
        {draft?.descuento && draft.descuento_importe ? (
          <div><dt>Descuento {draft.descuento}</dt><dd>−{formatPrice(draft.descuento_importe, cur)}</dd></div>
        ) : null}
        <div className="total"><dt>Total</dt><dd>{formatPrice(total, cur)}</dd></div>
        {pago?.tipo === 'financiado' && credit && (
          <div>
            <dt>Financiado · {pago.plazo} meses</dt>
            <dd>{formatMoney(financeSummary(total, credit.tin, pago.plazo).cuota, cur)}/mes</dd>
          </div>
        )}
      </dl>
      {pago?.tipo === 'financiado' && credit && <p className="fine">{CREDIT_NOTE}</p>}
      <Link href="/encargar" className="link">Modificar diseño</Link>
    </div>
  );
}
