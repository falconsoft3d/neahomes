import Link from 'next/link';
import { getToken } from '@/lib/odoo';
import Logo from './Logo';

export default async function Header() {
  const loggedIn = Boolean(await getToken());
  return (
    <header className="header">
      <Logo />
      <nav className="header-nav">
        <Link href="/encargar">Encargar casa</Link>
        <Link href="/#tamanos">Tamaños</Link>
        <Link href="/#precio">Precio cerrado</Link>
        <Link href="/contacto">Contacto</Link>
      </nav>
      <div className="header-actions">
        <Link href={loggedIn ? '/cuenta' : '/login'} className="header-account">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span>{loggedIn ? 'Mi cuenta' : 'Iniciar sesión'}</span>
        </Link>
      </div>
    </header>
  );
}
