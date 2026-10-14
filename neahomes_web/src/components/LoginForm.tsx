'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ConditionsCheckbox from './ConditionsCheckbox';
import { clearDraft, loadAcceptance, loadDraft } from '@/lib/draft';
import type { Conditions, Selection } from '@/lib/types';

export default function LoginForm({ conditions }: { conditions: Conditions | null }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Selection | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setDraft(loadDraft());
    setAccepted(Boolean(conditions && loadAcceptance() === conditions.id));
  }, [conditions]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      return setError(data.error ?? 'No se pudo iniciar sesión.');
    }
    // Si venía de diseñar una casa, la cotización pendiente se guarda al entrar.
    let target = '/cuenta';
    if (draft) {
      const q = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection: draft, accept_conditions: accepted ? conditions?.id : undefined }),
      });
      const qd = await q.json().catch(() => ({}));
      if (q.ok) {
        clearDraft();
        target = `/cuenta?nueva=${encodeURIComponent(qd.quote.name)}`;
      }
    }
    router.push(target);
    router.refresh();
  }

  return (
    <div className="auth-layout single">
      <form className="auth-form" onSubmit={onSubmit}>
        <h1>Iniciar sesión</h1>
        <p className="muted">Accede a tus cotizaciones y al seguimiento de tu casa.</p>
        <label>Usuario<input name="user" required autoComplete="username" autoCapitalize="none" /></label>
        <label>Contraseña<input name="password" type="password" required autoComplete="current-password" /></label>
        {draft && conditions && (
          <>
            <p className="muted">Al entrar guardaremos la casa que acabas de diseñar.</p>
            <ConditionsCheckbox conditions={conditions} checked={accepted} onChange={setAccepted} />
          </>
        )}
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </button>
        <div className="divider"><span>o</span></div>
        <Link href="/registro" className="btn btn-light btn-block">Crear cuenta</Link>
      </form>
    </div>
  );
}
