import Link from 'next/link';
import HouseIllustration from '@/components/HouseIllustration';
import { getCatalog } from '@/lib/odoo';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

const INCLUDED = ['Casa', 'Transporte', 'Montaje', 'Climatización', 'Garantía 2 años'];
const STEPS = [
  { n: '01', title: 'Diseña', text: 'Elige modelo, tamaño, cubierta y acabado. Ves el precio al instante.' },
  { n: '02', title: 'Guarda tu cotización', text: 'Crea tu cuenta y tu diseño queda guardado con su precio cerrado.' },
  { n: '03', title: 'Seguimiento', text: 'Un asesor te contacta y sigues el avance de tu casa desde tu cuenta.' },
];

export default async function Home() {
  const catalog = await getCatalog();
  const cur = catalog?.currency ?? 'EUR';
  const min = (items?: { price: number }[]) => (items?.length ? Math.min(...items.map((i) => i.price)) : 0);
  // Precio "desde" de una casa: modelo + cubierta + acabado más baratos, más el tamaño indicado.
  const base = catalog?.modelos.length ? min(catalog.modelos) + min(catalog.cubiertas) + min(catalog.acabados) : null;
  const cubierta = catalog?.cubiertas[0];
  const acabado = catalog?.acabados[0];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Llave en mano · Precio cerrado</p>
          <h1>Tu casa prefabricada, sin letra pequeña.</h1>
          {base !== null && <p className="hero-sub">Desde {formatPrice(base + min(catalog?.tamanos), cur)}</p>}
          <div className="hero-actions">
            <Link href="/encargar" className="btn btn-primary">Encargar casa</Link>
            <Link href="#tamanos" className="btn btn-light">Ver tamaños</Link>
          </div>
        </div>
        <HouseIllustration className="hero-house" m2={70} forma="dos_aguas" color="#23272d" showDimension={false} />
      </section>

      {catalog && catalog.tamanos.length > 0 && (
        <section id="tamanos" className="section">
          <div className="section-head">
            <h2>Tamaños para cada forma de vivir</h2>
            <p>Todos personalizables. Elige el tuyo y configúralo a tu medida.</p>
          </div>
          <div className="cards">
            {catalog.tamanos.map((t) => (
              <article key={t.id} className="card">
                <HouseIllustration m2={t.m2 || 70} forma={cubierta?.forma} color={acabado?.color} showDimension={false} />
                <div className="card-body">
                  <h3>{catalog.modelos[0]?.name} {t.m2 || t.name}</h3>
                  {base !== null && <p>Desde {formatPrice(base + t.price, cur)}</p>}
                  <Link href={`/encargar?tamano=${t.id}`} className="btn btn-primary btn-sm">Encargar</Link>
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

      <footer className="footer">
        <span>NeaHomes © {new Date().getFullYear()}</span>
        <Link href="/encargar">Encargar casa</Link>
        <Link href="/login">Mi cuenta</Link>
      </footer>
    </>
  );
}
