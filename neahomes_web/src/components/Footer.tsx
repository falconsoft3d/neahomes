import Link from 'next/link';
import { getSettings } from '@/lib/odoo';

export default async function Footer() {
  const { instagram_url } = await getSettings();
  return (
    <footer className="footer">
      <span>NeaHomes © {new Date().getFullYear()}</span>
      <Link href="/encargar">Encargar casa</Link>
      <Link href="/contacto">Contacto</Link>
      <Link href="/login">Mi cuenta</Link>
      {instagram_url && (
        <a href={instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
          </svg>
        </a>
      )}
    </footer>
  );
}
