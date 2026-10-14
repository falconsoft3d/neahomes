import Link from 'next/link';
import HouseIllustration from '@/components/HouseIllustration';
import HeroCarousel from '@/components/HeroCarousel';
import ModeloPhoto from '@/components/ModeloPhoto';
import { getCatalog, getSlides } from '@/lib/odoo';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

const INCLUDED = ['Casa', 'Transporte', 'Montaje', 'Climatización', 'Garantía 2 años'];
const STEPS = [
  { n: '01', title: 'Diseña', text: 'Elige modelo, cubierta y acabado. Ves el precio al instante.' },
  { n: '02', title: 'Guarda tu cotización', text: 'Crea tu cuenta y tu diseño queda guardado con su precio cerrado.' },
  { n: '03', title: 'Seguimiento', text: 'Un asesor te contacta y sigues el avance de tu casa desde tu cuenta.' },
];

export default async function Home() {
  const [catalog, slides] = await Promise.all([getCatalog(), getSlides()]);
  const cur = catalog?.currency ?? 'EUR';
  const min = (items?: { price: number }[]) => (items?.length ? Math.min(...items.map((i) => i.price)) : 0);
  // Precio "desde" de un modelo: su precio más la cubierta y el acabado más baratos.
  const extras = catalog ? min(catalog.cubiertas) + min(catalog.acabados) : 0;
  const acabado = catalog?.acabados[0];

  return (
    <>
      {/* Con slides configurados en Odoo (NeaHomes > Web > Carrusel) la portada es un carrusel. */}
      {slides.length > 0 ? (
        <HeroCarousel slides={slides} />
      ) : (
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Llave en mano · Precio cerrado</p>
          <h1>Tu casa prefabricada, sin letra pequeña.</h1>
          {catalog?.modelos.length ? <p className="hero-sub">Desde {formatPrice(min(catalog.modelos) + extras, cur)}</p> : null}
          <div className="hero-actions">
            <Link href="/encargar" className="btn btn-primary">Encargar casa</Link>
            <Link href="#modelos" className="btn btn-light">Ver modelos</Link>
          </div>
        </div>
        <HouseIllustration className="hero-house" m2={70} forma="dos_aguas" color="#23272d" showDimension={false} />
      </section>
      )}

      {catalog && catalog.modelos.length > 0 && (
        <section id="modelos" className="section">
          <div className="section-head">
            <h2>Un modelo para cada forma de vivir</h2>
            <p>Todos personalizables. Elige el tuyo y configúralo a tu medida.</p>
          </div>
          <div className="cards">
            {catalog.modelos.map((m) => (
              <article key={m.id} className="card">
                {m.image_version > 0 ? (
                  <ModeloPhoto id={m.id} version={m.image_version} alt={m.name} width={800} />
                ) : (
                  <HouseIllustration m2={m.m2 || 70} forma="plana" color={acabado?.color} showDimension={false} />
                )}
                <div className="card-body">
                  <h3>{m.name}</h3>
                  <p>{[m.m2 ? `${m.m2} m²` : '', `Desde ${formatPrice(m.price + extras, cur)}`].filter(Boolean).join(' · ')}</p>
                  <Link href={`/encargar?modelo=${m.id}`} className="btn btn-primary btn-sm">Encargar</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section id="precio" className="section split">
        <div>
          <p className="eyebrow">Precio cerrado</p>
          <h2>Otros te dan un precio. Nosotros te damos el precio.</h2>
          <p className="muted">La cifra que ves en el diseñador es la que firmas. Sin extras escondidos.</p>
          <Link href="/encargar" className="btn btn-dark">Calcular mi precio</Link>
        </div>
        <ul className="included">
          {INCLUDED.map((item) => (
            <li key={item}>
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
                <path d="m4 10.5 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              {item}
            </li>
          ))}
          <li className="included-total"><span>Total</span><strong>1 cifra</strong></li>
        </ul>
      </section>

      <section className="section steps">
        {STEPS.map((s) => (
          <div key={s.n} className="step">
            <span className="step-n">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </section>

    </>
  );
}
