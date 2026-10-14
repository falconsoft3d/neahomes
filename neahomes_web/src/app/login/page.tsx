import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { getConditions, getToken } from '@/lib/odoo';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  // Solo rutas internas, para no redirigir a otra web.
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : undefined;
  if (await getToken()) redirect(safeNext ?? '/cuenta');
  return <LoginForm conditions={await getConditions()} next={safeNext} />;
}
