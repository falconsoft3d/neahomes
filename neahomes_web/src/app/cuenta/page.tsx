import Link from 'next/link';
import { redirect } from 'next/navigation';
import HouseIllustration from '@/components/HouseIllustration';
import ModeloPhoto from '@/components/ModeloPhoto';
import LogoutButton from '@/components/LogoutButton';
import TicketForm from '@/components/TicketForm';
import { getToken, odoo } from '@/lib/odoo';
import { formatDate, formatPrice } from '@/lib/format';
import type { Partner, Quote, Ticket } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ nueva?: string }> };

export default async function CuentaPage({ searchParams }: Props) {
  const token = await getToken();
  if (!token) redirect('/login');
  const [res, catalog, { nueva }] = await Promise.all([
    odoo<{ partner: Partner; quotes: Quote[]; tickets: Ticket[] }>('/me', { token }),
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
  const { partner, quotes, tickets } = res.data;
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
              {q.modelo_image_version > 0 ? (
                <ModeloPhoto id={q.modelo_id} version={q.modelo_image_version} alt={q.modelo} width={800} />
              ) : (
                <HouseIllustration m2={q.modelo_m2 || 70} forma={q.cubierta_forma} color={q.acabado_color} showDimension={false} />
              )}
              <div className="quote-body">
                <div className="quote-top">
                  <h3>{q.modelo}</h3>
                  <span className={`badge badge-${q.state}`}>{q.state_label}</span>
                </div>
                <p className="muted">{q.name} · {formatDate(q.date)}</p>
                <p>{[q.modelo_m2 ? `${q.modelo_m2} m²` : '', q.cubierta, q.acabado].filter(Boolean).join(' · ')}</p>
                <p className="quote-total">{formatPrice(q.amount_total, cur)}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="account-section-head">
        <h2 className="account-title">Mis tickets</h2>
      </div>
      <TicketForm quotes={quotes} />
      {tickets.length === 0 ? (
        <p className="muted tickets-empty">No tienes tickets abiertos.</p>
      ) : (
        <ul className="tickets">
          {tickets.map((t) => (
            <li key={t.id} className="ticket">
              <div className="ticket-top">
                <h3>{t.title}</h3>
                <span className={`badge badge-${t.state}`}>{t.state_label}</span>
              </div>
              <p className="muted">
                {t.ref} · {formatDate(t.date)}
                {t.quote && <> · Cotización {t.quote}</>}
              </p>
              <p className="ticket-text">{t.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
