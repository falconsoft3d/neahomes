'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Country, CountryState, Profile } from '@/lib/types';

type Props = { profile: Profile; countries: Country[] };

type TextField = Exclude<keyof Profile, 'country_id' | 'state_id'>;

const FIELDS: { key: TextField; label: string; type?: string; autoComplete: string; wide?: boolean; required?: boolean }[] = [
  { key: 'name', label: 'Nombre completo', autoComplete: 'name', required: true },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
  { key: 'phone', label: 'Teléfono', type: 'tel', autoComplete: 'tel' },
  { key: 'mobile', label: 'Móvil', type: 'tel', autoComplete: 'tel' },
  { key: 'vat', label: 'NIF / DNI', autoComplete: 'off' },
  { key: 'street', label: 'Dirección', autoComplete: 'address-line1', wide: true },
  { key: 'street2', label: 'Dirección (línea 2)', autoComplete: 'address-line2', wide: true },
  { key: 'zip', label: 'Código postal', autoComplete: 'postal-code' },
  { key: 'city', label: 'Ciudad', autoComplete: 'address-level2' },
];

/** Datos del cliente: se guardan directamente en su contacto de Odoo. */
export default function ProfileSection({ profile: initial, countries }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [states, setStates] = useState<CountryState[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // Provincias del país elegido (en el formulario) o del guardado (en la vista).
  const countryId = editing ? form.country_id : profile.country_id;
  useEffect(() => {
    if (!countryId) return setStates([]);
    let cancelled = false;
    fetch(`/api/states?country=${countryId}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setStates(d.states ?? []))
      .catch(() => !cancelled && setStates([]));
    return () => {
      cancelled = true;
    };
  }, [countryId]);

  const set = (key: keyof Profile, value: string | number | null) => setForm((f) => ({ ...f, [key]: value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.status === 401) return router.push('/login');
    if (!res.ok) return setError(data.error ?? 'No se pudieron guardar los datos.');
    setProfile(data.profile);
    setForm(data.profile);
    setEditing(false);
    setSaved(true);
    router.refresh();
  }

  const countryName = countries.find((c) => c.id === profile.country_id)?.name ?? '';
  const stateName = states.find((s) => s.id === profile.state_id)?.name ?? '';
  const address = [
    [profile.street, profile.street2].filter(Boolean).join(', '),
    [profile.zip, profile.city].filter(Boolean).join(' '),
    [stateName, countryName].filter(Boolean).join(', '),
  ].filter(Boolean);
  const missing = !profile.phone && !profile.mobile ? 'teléfono' : !profile.street || !profile.zip || !profile.city ? 'dirección' : '';

  if (!editing) {
    return (
      <div className="profile-card">
        {saved && <p className="notice profile-notice">Datos guardados.</p>}
        {missing && !saved && (
          <p className="muted">Completa tu {missing} para que podamos preparar tu presupuesto y la entrega.</p>
        )}
        <dl className="profile-view">
          <div><dt>Nombre</dt><dd>{profile.name}</dd></div>
          <div><dt>Email</dt><dd>{profile.email || '—'}</dd></div>
          <div><dt>Teléfono</dt><dd>{[profile.phone, profile.mobile].filter(Boolean).join(' · ') || '—'}</dd></div>
          <div><dt>NIF / DNI</dt><dd>{profile.vat || '—'}</dd></div>
          <div className="wide"><dt>Dirección</dt><dd>{address.length ? address.map((l) => <span key={l}>{l}</span>) : '—'}</dd></div>
        </dl>
        <button type="button" className="btn btn-dark" onClick={() => { setForm(profile); setSaved(false); setEditing(true); }}>
          Editar mis datos
        </button>
      </div>
    );
  }

  return (
    <form className="profile-card profile-form" onSubmit={save}>
      <div className="profile-grid">
        {FIELDS.map((f) => (
          <label key={f.key} className={f.wide ? 'wide' : ''}>
            {f.label}
            <input
              name={f.key}
              type={f.type ?? 'text'}
              autoComplete={f.autoComplete}
              required={f.required}
              maxLength={255}
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </label>
        ))}
        <label>
          País
          <select
            value={form.country_id ?? ''}
            autoComplete="country"
            onChange={(e) => setForm((cur) => ({ ...cur, country_id: e.target.value ? Number(e.target.value) : null, state_id: null }))}
          >
            <option value="">Selecciona un país</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Provincia
          <select
            value={form.state_id ?? ''}
            autoComplete="address-level1"
            disabled={!form.country_id || states.length === 0}
            onChange={(e) => set('state_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{form.country_id && states.length === 0 ? 'No aplica' : 'Selecciona una provincia'}</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="profile-actions">
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        <button type="button" className="btn btn-light" onClick={() => { setEditing(false); setError(''); }}>Cancelar</button>
      </div>
    </form>
  );
}
