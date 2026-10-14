import type { Metadata } from 'next';
import { getPage } from '@/lib/odoo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('quienes-somos');
  return { title: `${page?.title ?? 'Quiénes somos'} · NeaHomes`, description: page?.subtitle || undefined };
}

/** Contenido editable en Odoo: NeaHomes > Web > Quiénes somos. */
export default async function QuienesSomosPage() {
  const page = await getPage('quienes-somos');
  if (!page) {
    return (
      <div className="empty-state">
        <h1>Quiénes somos</h1>
        <p>Esta página no está disponible en este momento.</p>
      </div>
    );
  }
  return (
    <>
      <section className={`about-hero${page.image_version ? ' has-image' : ''}`}>
        {page.image_version > 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/pages/image/${page.id}?v=${page.image_version}&w=2560`} alt="" />
        )}
        <div className="about-hero-copy">
          <h1>{page.title}</h1>
          {page.subtitle && <p>{page.subtitle}</p>}
        </div>
      </section>
      <article className="legal about-body">
        {/* Contenido escrito en Odoo (campo Html saneado por Odoo). */}
        <div className="legal-body blog-body" dangerouslySetInnerHTML={{ __html: page.body }} />
      </article>
    </>
  );
}
