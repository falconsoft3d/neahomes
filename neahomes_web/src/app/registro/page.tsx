import { redirect } from 'next/navigation';
import RegisterForm from '@/components/RegisterForm';
import { getCatalog, getConditions, getToken } from '@/lib/odoo';

export const dynamic = 'force-dynamic';

export default async function RegistroPage() {
  if (await getToken()) redirect('/cuenta');
  const [catalog, conditions] = await Promise.all([getCatalog(), getConditions()]);
  return <RegisterForm catalog={catalog} conditions={conditions} />;
}
