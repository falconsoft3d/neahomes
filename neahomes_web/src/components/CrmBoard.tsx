'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatPrice } from '@/lib/format';
import type { CrmQuote, QuoteState } from '@/lib/types';

type Props = { states: { key: QuoteState; label: string }[]; quotes: CrmQuote[]; currency: string };

/** Tablero del comercial: una columna por estado; las cotizaciones se arrastran o se mueven con el selector. */
export default function CrmBoard({ states, quotes, currency }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(quotes);
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<QuoteState | null>(null);
  const [error, setError] = useState('');

  async function move(id: number, state: QuoteState) {
    const prev = items;
    const quote = prev.find((q) => q.id === id);
    if (!quote || quote.state === state) return;
    setError('');
    const label = states.find((s) => s.key === state)?.label ?? state;
    setItems(prev.map((q) => (q.id === id ? { ...q, state, state_label: label } : q)));
    const res = await fetch(`/api/crm/quotes/${id}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
    if (res.status === 401) return router.push('/login');
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setItems(prev);
      setError(data.error ?? 'No se pudo mover la cotización.');
    }
  }

  return (
    <>
      {error && <p className="form-error crm-error">{error}</p>}
      <div className="crm-board">
        {states.map((col) => {
          const colItems = items.filter((q) => q.state === col.key);
          return (
            <section
              key={col.key}
              className={`crm-col${over === col.key ? ' is-over' : ''}`}
              aria-label={col.label}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col.key);
              }}
              onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragId !== null) move(dragId, col.key);
              }}
            >
              <header className="crm-col-head">
                <span className={`badge badge-${col.key}`}>{col.label}</span>
                <span className="crm-count">{colItems.length}</span>
              </header>
              {colItems.length === 0 && <p className="crm-empty">Sin cotizaciones</p>}
              {colItems.map((q) => (
                <article
                  key={q.id}
                  className={`crm-card${dragId === q.id ? ' is-dragging' : ''}`}
                  draggable
                  onDragStart={(e) => {
                    setDragId(q.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => setDragId(null)}
                >
                  <div className="crm-card-top">
                    <strong>{q.name}</strong>
                    <span className="muted">{formatDate(q.date)}</span>
                  </div>
                  <p className="crm-client">{q.client.name}</p>
                  <p className="crm-contact">
                    {q.client.email && <a href={`mailto:${q.client.email}`}>{q.client.email}</a>}
                    {q.client.phone && <a href={`tel:${q.client.phone}`}>{q.client.phone}</a>}
                  </p>
                  <p className="muted">
                    {[q.modelo, q.cubierta, q.acabado].filter(Boolean).join(' · ')}
                  </p>
                  {q.distribuciones.length > 0 && (
                    <p className="muted">{q.distribuciones.map((d) => `${d.name}: ${d.cantidad}`).join(' · ')}</p>
                  )}
                  <div className="crm-card-bottom">
                    <span className="crm-total">{formatPrice(q.amount_total, currency)}</span>
                    <label className="sr-only" htmlFor={`move-${q.id}`}>Mover {q.name}</label>
                    <select
                      id={`move-${q.id}`}
                      value={q.state}
                      onChange={(e) => move(q.id, e.target.value as QuoteState)}
                    >
                      {states.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
