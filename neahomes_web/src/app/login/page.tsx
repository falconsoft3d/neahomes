import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { getToken } from '@/lib/odoo';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getToken()) redirect('/cuenta');
  return <LoginForm />;
}
