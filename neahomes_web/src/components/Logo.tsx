import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label="NeaHomes, inicio">
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
        <path d="M4 15 16 5l12 10v13h-7v-8h-10v8H4z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <span className="logo-text">
        NEA<small>HOMES</small>
      </span>
    </Link>
  );
}
