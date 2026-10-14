'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Captcha from './Captcha';
import ConditionsCheckbox from './ConditionsCheckbox';
import QuoteSummary from './QuoteSummary';
import { clearDraft, clearRef, loadAcceptance, loadDraft, loadRef } from '@/lib/draft';
import type { Catalog, Conditions, Selection } from '@/lib/types';

export default function RegisterForm({ catalog, conditions }: { catalog: Catalog | null; conditions: Conditions | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Selection | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

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
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        selection: draft,
        accept_conditions: accepted ? conditions?.id : undefined,
        // Enlace de recomendación con el que llegó (si lo hay): Odoo lo guarda como origen del contacto.
        ref_code: loadRef() ?? undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      // Cada verificación sirve una vez: tras cualquier error se pide una nueva.
      setCaptchaKey((k) => k + 1);
      return setError(data.error ?? 'No se pudo completar el registro.');
    }
    clearDraft();
    clearRef();
    router.push(data.quote ? `/cuenta?nueva=${encodeURIComponent(data.quote.name)}` : '/cuenta');
    router.refresh();
  }

  return (
    <div className="auth-layout">
      <form className="auth-form" onSubmit={onSubmit}>
        <h1>Guarda tu cotización</h1>
        <p className="muted">Crea tu cuenta NeaHome para guardar el diseño y seguir el avance de tu casa.</p>
        <label>Nombre completo<input name="name" required autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Teléfono<input name="phone" type="tel" autoComplete="tel" /></label>
        <label>Usuario<input name="user" required autoComplete="username" autoCapitalize="none" /></label>
        <label>Contraseña<input name="password" type="password" required minLength={6} autoComplete="new-password" /></label>
        {draft && conditions && <ConditionsCheckbox conditions={conditions} checked={accepted} onChange={setAccepted} />}
        <Captcha resetKey={captchaKey} />
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Creando cuenta…' : draft ? 'Registrarme y guardar' : 'Crear cuenta'}
        </button>
        <p className="muted center">
          ¿Ya tienes cuenta? <Link href="/login" className="link">Inicia sesión</Link>
        </p>
      </form>
      {catalog && <QuoteSummary catalog={catalog} draft={draft} />}
    </div>
  );
}
