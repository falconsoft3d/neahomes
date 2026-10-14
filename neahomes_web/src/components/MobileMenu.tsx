'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import InstagramIcon from './InstagramIcon';

type Props = {
  links: { href: string; label: string }[];
  account: { href: string; label: string };
  instagramUrl: string;
};

/** Menú desplegable para móvil: el menú superior no cabe en pantallas estrechas. */
export default function MobileMenu({ links, account, instagramUrl }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Se cierra al navegar y con Escape; mientras está abierto la página no hace scroll.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {/* Fuera del header: su backdrop-filter haría que un panel fijo se recortara a la altura del header. */}
      {open && createPortal(
        <nav id="mobile-menu" className="mobile-menu" aria-label="Menú principal">
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
              </li>
            ))}
            <li>
              <Link href={account.href} onClick={() => setOpen(false)}>{account.label}</Link>
            </li>
          </ul>
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="mobile-menu-social">
              <InstagramIcon /> Instagram
            </a>
          )}
        </nav>,
        document.body,
      )}
    </>
  );
}
