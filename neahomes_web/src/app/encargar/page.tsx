import Configurator from '@/components/Configurator';
import { getCatalog, getToken } from '@/lib/odoo';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function EncargarPage({ searchParams }: Props) {
  const [catalog, token, params] = await Promise.all([getCatalog(), getToken(), searchParams]);
  if (!catalog) {
    return (
      <div className="empty-state">
        <h1>Diseñador no disponible</h1>
        <p>No pudimos cargar el catálogo. Inténtalo de nuevo en unos minutos.</p>
      </div>
    );
  }
  const num = (v?: string) => (v ? Number(v) : undefined);
  return (
    <Configurator
      catalog={catalog}
      loggedIn={Boolean(token)}
      initial={{
        modelo_id: num(params.modelo),
        cubierta_id: num(params.cubierta),
        acabado_id: num(params.acabado),
      }}
    />
  );
}
