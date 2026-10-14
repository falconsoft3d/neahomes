'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }
  return (
    <button type="button" className="btn btn-light" onClick={logout}>
      Cerrar sesión
    </button>
  );
}
