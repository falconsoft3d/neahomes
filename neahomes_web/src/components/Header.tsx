import Link from 'next/link';
import { getIsComercial, getSettings, getToken } from '@/lib/odoo';
import InstagramIcon from './InstagramIcon';
import Logo from './Logo';
import MobileMenu from './MobileMenu';

export default async function Header() {
  const [token, comercial, { instagram_url }] = await Promise.all([getToken(), getIsComercial(), getSettings()]);
  const loggedIn = Boolean(token);
  const links = [
    { href: '/encargar', label: 'Encargar casa' },
    { href: '/#modelos', label: 'Modelos' },
    { href: '/quienes-somos', label: 'Quiénes somos' },
    { href: '/blog', label: 'Blog' },
    { href: '/contacto', label: 'Contacto' },
    ...(loggedIn && comercial ? [{ href: '/crm', label: 'CRM' }] : []),
  ];
  const account = loggedIn ? { href: '/cuenta', label: 'Mi cuenta' } : { href: '/login', label: 'Iniciar sesión' };

  return (
    <header className="header">
      <Logo />
      <nav className="header-nav" aria-label="Menú principal">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>{l.label}</Link>
        ))}
      </nav>
      <div className="header-actions">
        {instagram_url && (
          <a href={instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="header-icon">
            <InstagramIcon />
          </a>
        )}
        <Link href={account.href} className="header-account" aria-label={account.label}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span>{account.label}</span>
        </Link>
        <MobileMenu links={links} account={account} instagramUrl={instagram_url} />
      </div>
    </header>
  );
}
