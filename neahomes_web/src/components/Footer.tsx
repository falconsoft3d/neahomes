import Link from 'next/link';
import CookieSettingsButton from './CookieSettingsButton';

export default function Footer() {
  return (
    <footer className="footer">
      <span>NeaHomes © {new Date().getFullYear()}</span>
      <Link href="/encargar">Encargar casa</Link>
      <Link href="/quienes-somos">Quiénes somos</Link>
      <Link href="/contacto">Contacto</Link>
      <Link href="/login">Mi cuenta</Link>
      <Link href="/condiciones">Condiciones de venta</Link>
      <Link href="/cookies">Política de cookies</Link>
      <CookieSettingsButton />
    </footer>
  );
}
