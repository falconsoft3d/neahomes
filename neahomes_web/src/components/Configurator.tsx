'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import HouseIllustration from './HouseIllustration';
import ModeloPhoto from './ModeloPhoto';
import { formatExtra, formatPrice } from '@/lib/format';
import { resolveSelection, saveDraft } from '@/lib/draft';
import type { Catalog, Selection } from '@/lib/types';

type Props = { catalog: Catalog; loggedIn: boolean; initial: Partial<Selection> };

function pick<T extends { id: number }>(items: T[], id?: number) {
  return (items.find((i) => i.id === id) ?? items[0])?.id ?? 0;
}

export default function Configurator({ catalog, loggedIn, initial }: Props) {
  const router = useRouter();
  const cur = catalog.currency;
  const [sel, setSel] = useState<Selection>({
    modelo_id: pick(catalog.modelos, initial.modelo_id),
    cubierta_id: pick(catalog.cubiertas, initial.cubierta_id),
    acabado_id: pick(catalog.acabados, initial.acabado_id),
  });
  // Con foto del modelo se alterna entre la foto real y el dibujo que refleja cubierta y acabado.
  const [view, setView] = useState<'foto' | 'diseno'>('foto');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const r = useMemo(() => resolveSelection(catalog, sel), [catalog, sel]);
  const set = (key: keyof Selection) => (id: number) => {
    setSel((s) => ({ ...s, [key]: id }));
    setView(key === 'modelo_id' ? 'foto' : 'diseno');
  };

  if (!r) {
    return (
      <div className="empty-state">
        <h1>Diseñador no disponible</h1>
        <p>Faltan modelos, cubiertas o acabados en Odoo.</p>
      </div>
    );
  }

  async function encargar() {
    setError('');
    if (!loggedIn) {
      saveDraft(sel);
      router.push('/registro');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selection: sel }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      saveDraft(sel);
      router.push('/login');
      return;
    }
    setSaving(false);
    if (!res.ok) return setError(data.error ?? 'No se pudo guardar la cotización.');
    router.push(`/cuenta?nueva=${encodeURIComponent(data.quote.name)}`);
    router.refresh();
  }

  const summary = [r.modelo.m2 ? `${r.modelo.m2} m²` : '', r.cubierta.name, r.acabado.name].filter(Boolean).join(' · ');
  const cta = loggedIn ? 'Guardar cotización' : 'Encargar casa';

  return (
    <div className="configurator">
      <section className="cfg-stage">
        <div className="cfg-stage-inner">
          {r.modelo.image_version > 0 && view === 'foto' ? (
            <ModeloPhoto key={r.modelo.id} id={r.modelo.id} version={r.modelo.image_version} alt={r.modelo.name} className="cfg-photo" />
          ) : (
            <>
              <HouseIllustration m2={r.modelo.m2 || 70} forma={r.cubierta.forma} color={r.acabado.color} className="cfg-house" />
              <p className="cfg-caption">Alzado frontal · ilustración orientativa</p>
            </>
          )}
          {r.modelo.image_version > 0 && (
            <div className="view-toggle" role="group" aria-label="Vista">
              <button type="button" className={view === 'foto' ? 'is-selected' : ''} onClick={() => setView('foto')} aria-pressed={view === 'foto'}>
                Foto
              </button>
              <button type="button" className={view === 'diseno' ? 'is-selected' : ''} onClick={() => setView('diseno')} aria-pressed={view === 'diseno'}>
                Tu diseño
              </button>
            </div>
          )}
        </div>
      </section>

      <aside className="cfg-panel">
        <header className="cfg-title">
          <h1>{r.modelo.name}</h1>
          <p>Llave en mano · Precio cerrado</p>
        </header>

        {catalog.modelos.length > 0 && (
          <div className="cfg-group">
            <h2>Modelo</h2>
            {catalog.modelos.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`option-card${m.id === sel.modelo_id ? ' is-selected' : ''}`}
                onClick={() => set('modelo_id')(m.id)}
                aria-pressed={m.id === sel.modelo_id}
              >
                <span>
                  <strong>{m.name}</strong>
                  <small>{[m.m2 ? `${m.m2} m²` : '', m.description].filter(Boolean).join(' · ')}</small>
                </span>
                <span className="option-price">{formatPrice(m.price, cur)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="cfg-group">
          <h2>Cubierta</h2>
          <div className="segmented">
            {catalog.cubiertas.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`segment${c.id === sel.cubierta_id ? ' is-selected' : ''}`}
                onClick={() => set('cubierta_id')(c.id)}
                aria-pressed={c.id === sel.cubierta_id}
              >
                <strong>{c.name}</strong>
                <small>{formatExtra(c.price, cur)}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="cfg-group">
          <h2>Acabado exterior</h2>
          <div className="swatches">
            {catalog.acabados.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`swatch${a.id === sel.acabado_id ? ' is-selected' : ''}`}
                style={{ '--swatch': a.color } as React.CSSProperties}
                onClick={() => set('acabado_id')(a.id)}
                aria-label={a.name}
                aria-pressed={a.id === sel.acabado_id}
                title={a.name}
              />
            ))}
          </div>
          <p className="swatch-label">
            <strong>{r.acabado.name}</strong> <span>{formatExtra(r.acabado.price, cur)}</span>
          </p>
        </div>

        <div className="cfg-group cfg-summary">
          <h2>Resumen</h2>
          <dl>
            <div><dt>{r.modelo.name}{r.modelo.m2 ? ` · ${r.modelo.m2} m²` : ''}</dt><dd>{formatPrice(r.modelo.price, cur)}</dd></div>
            <div><dt>Cubierta {r.cubierta.name.toLowerCase()}</dt><dd>{formatExtra(r.cubierta.price, cur)}</dd></div>
            <div><dt>Acabado {r.acabado.name.toLowerCase()}</dt><dd>{formatExtra(r.acabado.price, cur)}</dd></div>
            <div className="total"><dt>Total</dt><dd>{formatPrice(r.total, cur)}</dd></div>
          </dl>
          <p className="fine">Incluye transporte, montaje y climatización. Impuestos no incluidos.</p>
        </div>
      </aside>

      <footer className="cfg-bar">
        <div className="cfg-bar-info">
          <strong>{r.modelo.name}</strong>
          <span>{summary}</span>
        </div>
        <div className="cfg-bar-price">
          <strong>{formatPrice(r.total, cur)}</strong>
          <span>Precio cerrado</span>
        </div>
        <div className="cfg-bar-action">
          {error && <span className="form-error">{error}</span>}
          <button type="button" className="btn btn-primary" onClick={encargar} disabled={saving}>
            {saving ? 'Guardando…' : cta}
          </button>
        </div>
      </footer>
    </div>
  );
}
