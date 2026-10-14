import { redirect } from 'next/navigation';
import RegisterForm from '@/components/RegisterForm';
import { getCatalog, getToken } from '@/lib/odoo';

export const dynamic = 'force-dynamic';

export default async function RegistroPage() {
  if (await getToken()) redirect('/cuenta');
  return <RegisterForm catalog={await getCatalog()} />;
}
