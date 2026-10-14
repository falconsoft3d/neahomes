import { redirect } from 'next/navigation';
import CrmBoard from '@/components/CrmBoard';
import TicketCard from '@/components/TicketCard';
import { getToken, odoo } from '@/lib/odoo';
import type { CrmQuote, QuoteState, Ticket } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'CRM · NeaHomes' };

type CrmData = { states: { key: QuoteState; label: string }[]; quotes: CrmQuote[]; tickets: Ticket[] };

export default async function CrmPage() {
  const token = await getToken();
  if (!token) redirect('/login');
  const [res, catalog] = await Promise.all([
    odoo<CrmData>('/crm', { token }),
    odoo<{ currency: string }>('/catalog'),
  ]);
  if (res.status === 401) redirect('/login');
  // Solo los comerciales ven el CRM.
  if (res.status === 403) redirect('/cuenta');
  if (!res.ok) {
    return (
      <div className="empty-state">
        <h1>CRM no disponible</h1>
        <p>{res.data.error}</p>
      </div>
    );
  }
  const { states, quotes, tickets } = res.data;
  const open = tickets.filter((t) => t.state !== 'resuelto');

  return (
    <div className="crm">
      <header className="account-head">
        <div>
          <h1>CRM</h1>
          <p className="muted">
            {quotes.length} cotizaciones asignadas · {open.length} tickets abiertos
          </p>
        </div>
      </header>

      <h2 className="account-title">Cotizaciones</h2>
      <CrmBoard states={states} quotes={quotes} currency={catalog.data.currency ?? 'EUR'} />

      <div className="account-section-head">
        <h2 className="account-title">Tickets de mis clientes</h2>
      </div>
      {tickets.length === 0 ? (
        <p className="muted tickets-empty">Tus clientes no tienen tickets.</p>
      ) : (
        <ul className="tickets">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} showClient />
          ))}
        </ul>
      )}
    </div>
  );
}
