import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { getConditions, getToken } from '@/lib/odoo';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getToken()) redirect('/cuenta');
  return <LoginForm conditions={await getConditions()} />;
}
