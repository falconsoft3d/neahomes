import Link from 'next/link';
import { redirect } from 'next/navigation';
import HouseIllustration from '@/components/HouseIllustration';
import LogoutButton from '@/components/LogoutButton';
import { getToken, odoo } from '@/lib/odoo';
import { formatDate, formatPrice } from '@/lib/format';
import type { Partner, Quote } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ nueva?: string }> };

export default async function CuentaPage({ searchParams }: Props) {
  const token = await getToken();
  if (!token) redirect('/login');
  const [res, catalog, { nueva }] = await Promise.all([
    odoo<{ partner: Partner; quotes: Quote[] }>('/me', { token }),
    odoo<{ currency: string }>('/catalog'),
    searchParams,
  ]);
  // Token caducado o contraseña cambiada desde Odoo: hay que volver a entrar.
  if (res.status === 401) redirect('/login');
  if (!res.ok) {
    return (
      <div className="empty-state">
        <h1>Cuenta no disponible</h1>
        <p>{res.data.error}</p>
      </div>
    );
  }
  const { partner, quotes } = res.data;
  const cur = catalog.data.currency ?? 'EUR';

  return (
    <div className="account">
      <header className="account-head">
        <div>
          <h1>Hola, {partner.name.split(' ')[0]}</h1>
          <p className="muted">{partner.email}</p>
        </div>
        <div className="account-actions">
          <Link href="/encargar" className="btn btn-primary">Diseñar otra casa</Link>
          <LogoutButton />
        </div>
      </header>

      {nueva && (
        <p className="notice">
          Cotización <strong>{nueva}</strong> guardada. Un asesor de NeaHomes se pondrá en contacto contigo.
        </p>
      )}

      <h2 className="account-title">Mis cotizaciones</h2>
      {quotes.length === 0 ? (
        <div className="summary-card">
          <p className="muted">Todavía no tienes cotizaciones.</p>
          <Link href="/encargar" className="btn btn-light">Diseñar mi casa</Link>
        </div>
      ) : (
        <div className="quotes">
          {quotes.map((q) => (
            <article key={q.id} className={`quote${q.name === nueva ? ' is-new' : ''}`}>
              <HouseIllustration m2={q.tamano_m2 || 70} forma={q.cubierta_forma} color={q.acabado_color} showDimension={false} />
              <div className="quote-body">
                <div className="quote-top">
                  <h3>{q.modelo} {q.tamano_m2 || ''}</h3>
                  <span className="badge">{q.stage}</span>
                </div>
                <p className="muted">{q.name} · {formatDate(q.date)}</p>
                <p>{[q.tamano, q.cubierta, q.acabado].join(' · ')}</p>
                <p className="quote-total">{formatPrice(q.amount_total, cur)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
