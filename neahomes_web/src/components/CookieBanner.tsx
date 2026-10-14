'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, OPEN_SETTINGS_EVENT, readConsent, saveConsent, type Category } from '@/lib/consent';

const NONE: Record<Category, boolean> = { analiticas: false, marketing: false };
const ALL: Record<Category, boolean> = { analiticas: true, marketing: true };

/**
 * Banner de cookies: aparece hasta que el usuario elige. «Aceptar» y «Rechazar» tienen el mismo peso,
 * nada no esencial viene activado por defecto y la elección se puede cambiar desde el footer.
 */
export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [configuring, setConfiguring] = useState(false);
  const [choice, setChoice] = useState<Record<Category, boolean>>(NONE);

  useEffect(() => {
    if (!readConsent()) setOpen(true);
    const reopen = () => {
      const current = readConsent();
      setChoice(current ? { analiticas: current.analiticas, marketing: current.marketing } : NONE);
      setConfiguring(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, []);

  if (!open) return null;

  const decide = (value: Record<Category, boolean>) => {
    saveConsent(value);
    setOpen(false);
    setConfiguring(false);
  };

  return (
    <div className="cookie-banner" role="dialog" aria-modal="false" aria-labelledby="cookie-title">
      <h2 id="cookie-title">Cookies</h2>
      <p>
        Usamos cookies técnicas necesarias para que la web funcione, como mantener tu sesión. Con tu permiso
        podríamos usar también cookies analíticas y de marketing; hoy no usamos ninguna. Puedes cambiar tu
        elección cuando quieras. Más información en la <Link href="/cookies">política de cookies</Link>.
      </p>

      {configuring && (
        <ul className="cookie-categories">
          <li>
            <div>
              <strong>Necesarias</strong>
              <small>Sesión de usuario, acceso al CRM y recordar esta elección. Siempre activas.</small>
            </div>
            <input type="checkbox" checked disabled aria-label="Cookies necesarias (siempre activas)" />
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.key}>
              <label htmlFor={`cookie-${c.key}`}>
                <strong>{c.title}</strong>
                <small>{c.text}</small>
              </label>
              <input
                id={`cookie-${c.key}`}
                type="checkbox"
                checked={choice[c.key]}
                onChange={(e) => setChoice((cur) => ({ ...cur, [c.key]: e.target.checked }))}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="cookie-actions">
        <button type="button" className="btn btn-dark" onClick={() => decide(NONE)}>Rechazar</button>
        <button type="button" className="btn btn-dark" onClick={() => decide(ALL)}>Aceptar</button>
        {configuring ? (
          <button type="button" className="btn btn-light" onClick={() => decide(choice)}>Guardar selección</button>
        ) : (
          <button type="button" className="btn btn-light" onClick={() => setConfiguring(true)}>Configurar</button>
        )}
      </div>
    </div>
  );
}
