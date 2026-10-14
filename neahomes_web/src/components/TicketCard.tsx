'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/format';
import type { Ticket } from '@/lib/types';

/** Ticket con su conversación. Lo usan el cliente (/cuenta) y el comercial (/crm). */
export default function TicketCard({ ticket: initial, showClient = false }: { ticket: Ticket; showClient?: boolean }) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initial);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError('');
    setSending(true);
    const res = await fetch(`/api/tickets/${ticket.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (res.status === 401) return router.push('/login');
    if (!res.ok) return setError(data.error ?? 'No se pudo enviar la respuesta.');
    setTicket(data.ticket);
    setText('');
  }

  const count = ticket.messages.length;

  return (
    <li className="ticket">
      <div className="ticket-top">
        <h3>{ticket.title}</h3>
        <span className={`badge badge-${ticket.state}`}>{ticket.state_label}</span>
      </div>
      <p className="muted">
        {ticket.ref} · {formatDate(ticket.date)}
        {showClient && <> · {ticket.client}</>}
        {ticket.quote && <> · Cotización {ticket.quote}</>}
      </p>
      <p className="ticket-text">{ticket.description}</p>

      <details className="ticket-thread" open={count > 0 && count <= 3}>
        <summary>{count ? `Conversación (${count})` : 'Responder'}</summary>
        {count > 0 && (
          <ol className="messages">
            {ticket.messages.map((m) => (
              <li key={m.id} className={`message${m.mine ? ' is-mine' : ''}`}>
                <div className="message-meta">
                  <strong>{m.mine ? 'Tú' : m.author}</strong> · {formatDate(m.date)}
                </div>
                <p>{m.body}</p>
              </li>
            ))}
          </ol>
        )}
        <form className="reply-form" onSubmit={reply}>
          <label className="sr-only" htmlFor={`reply-${ticket.id}`}>Respuesta</label>
          <textarea
            id={`reply-${ticket.id}`}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe una respuesta…"
            required
          />
          <button className="btn btn-dark btn-sm" disabled={sending || !text.trim()}>
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
      </details>
    </li>
  );
}
