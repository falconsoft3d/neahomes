'use client';

import { useState } from 'react';
import Captcha from './Captcha';

export default function ContactForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = e.currentTarget;
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    // Cada verificación sirve una vez: se pide una nueva tras enviar o tras un error.
    setCaptchaKey((k) => k + 1);
    if (!res.ok) return setError(data.error ?? 'No se pudo enviar el mensaje.');
    form.reset();
    setSent(true);
  }

  return (
    <div className="auth-layout single">
      <form className="auth-form" onSubmit={onSubmit}>
        <h1>Contacto</h1>
        <p className="muted">Cuéntanos qué necesitas y te respondemos lo antes posible.</p>
        <label>Nombre<input name="name" required autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Teléfono<input name="phone" type="tel" autoComplete="tel" /></label>
        <label>Texto<textarea name="message" required rows={5} /></label>
        <Captcha resetKey={captchaKey} />
        {error && <p className="form-error">{error}</p>}
        {sent && <p className="notice">Mensaje enviado. Gracias por escribirnos.</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
