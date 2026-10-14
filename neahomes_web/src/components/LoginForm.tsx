'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearDraft, loadDraft } from '@/lib/draft';

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    const draft = loadDraft();
    if (draft) {
      const q = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection: draft }),
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
