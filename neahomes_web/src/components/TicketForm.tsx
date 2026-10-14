'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Quote } from '@/lib/types';

export default function TicketForm({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, quote_id: form.quote_id ? Number(form.quote_id) : null }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 401) return router.push('/login');
    if (!res.ok) return setError(data.error ?? 'No se pudo crear el ticket.');
    setOpen(false);
    setSent(data.ticket.ref);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="ticket-new">
        {sent && <p className="notice">Ticket <strong>{sent}</strong> creado. Te avisaremos de su avance aquí.</p>}
        <button type="button" className="btn btn-dark" onClick={() => { setSent(''); setOpen(true); }}>
          Nuevo ticket
        </button>
      </div>
    );
  }

  return (
    <form className="auth-form ticket-form" onSubmit={onSubmit}>
      <h3>Nuevo ticket</h3>
      <label>Título<input name="title" required maxLength={120} /></label>
      <label>Texto<textarea name="description" required rows={4} /></label>
      <label>
        Cotización relacionada
        <select name="quote_id" defaultValue="">
          <option value="">Sin cotización</option>
          {quotes.map((q) => (
            <option key={q.id} value={q.id}>{q.name} · {q.modelo}</option>
          ))}
        </select>
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="ticket-form-actions">
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Enviando…' : 'Enviar ticket'}</button>
        <button type="button" className="btn btn-light" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </form>
  );
}
