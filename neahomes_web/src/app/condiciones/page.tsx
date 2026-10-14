import { getConditions } from '@/lib/odoo';
import { formatDate } from '@/lib/format';

export const metadata = { title: 'Condiciones de venta · NeaHomes' };

export default async function CondicionesPage() {
  const conditions = await getConditions();
  if (!conditions) {
    return (
      <div className="empty-state">
        <h1>Condiciones de venta</h1>
        <p>No hay condiciones de venta publicadas en este momento.</p>
      </div>
    );
  }
  return (
    <article className="legal">
      <h1>{conditions.name}</h1>
      <p className="muted">Fecha: {formatDate(conditions.date)}</p>
      {/* Texto editado en Odoo (campo Html saneado por Odoo). */}
      <div className="legal-body" dangerouslySetInnerHTML={{ __html: conditions.body }} />
    </article>
  );
}
