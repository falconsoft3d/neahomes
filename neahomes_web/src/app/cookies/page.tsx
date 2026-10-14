import CookieSettingsButton from '@/components/CookieSettingsButton';
import { getSettings } from '@/lib/odoo';

export const metadata = { title: 'Política de cookies · NeaHomes' };

const UPDATED = '14 de octubre de 2026';

const COOKIES = [
  { name: 'nea_token', purpose: 'Mantener la sesión iniciada en tu cuenta.', type: 'Técnica', duration: '30 días o hasta cerrar sesión' },
  { name: 'nea_role', purpose: 'Mostrar el acceso al CRM a los comerciales.', type: 'Técnica', duration: '30 días o hasta cerrar sesión' },
  { name: 'nea_consent', purpose: 'Recordar tu elección sobre las cookies.', type: 'Técnica', duration: '12 meses' },
  { name: 'neahomes_draft', purpose: 'Guardar en tu navegador (almacenamiento local) la casa que has diseñado hasta que te registras.', type: 'Técnica', duration: 'Hasta que guardas la cotización o borras los datos del navegador' },
  { name: 'neahomes_conditions', purpose: 'Recordar (almacenamiento local) que aceptaste las condiciones de venta al diseñar, hasta guardar la cotización.', type: 'Técnica', duration: 'Hasta que guardas la cotización o borras los datos del navegador' },
  { name: 'neahomes_ref', purpose: 'Recordar (almacenamiento local) el código del enlace de recomendación con el que llegaste, para aplicarlo y registrarlo al crear tu cuenta.', type: 'Técnica', duration: '30 días o hasta que te registras' },
];

const BROWSERS = [
  { name: 'Google Chrome', url: 'https://support.google.com/chrome/answer/95647' },
  { name: 'Mozilla Firefox', url: 'https://support.mozilla.org/es/kb/Borrar%20cookies' },
  { name: 'Safari', url: 'https://support.apple.com/es-es/guide/safari/sfri11471/mac' },
  { name: 'Microsoft Edge', url: 'https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09' },
];

export default async function CookiesPage() {
  const { legal } = await getSettings();
  const company = legal.company || 'NeaHomes';

  return (
    <article className="legal">
      <h1>Política de cookies</h1>
      <p className="muted">Última actualización: {UPDATED}</p>

      <h2>¿Qué son las cookies?</h2>
      <p>
        Las cookies son pequeños archivos que una web guarda en tu navegador para recordar información entre
        visitas. Tecnologías parecidas, como el almacenamiento local del navegador, se rigen por las mismas reglas
        y también se explican aquí.
      </p>

      <h2>Responsable</h2>
      <p>
        {company}
        {legal.nif && <>, con NIF {legal.nif}</>}
        {legal.address && <>, con domicilio en {legal.address}</>}.
        {legal.email && (
          <> Puedes escribirnos a <a href={`mailto:${legal.email}`}>{legal.email}</a>.</>
        )}
      </p>

      <h2>Cookies que utilizamos</h2>
      <p>
        Solo usamos cookies técnicas propias, imprescindibles para darte el servicio que pides (diseñar tu casa,
        guardar la cotización y acceder a tu cuenta). Están exentas de consentimiento según el artículo 22.2 de la
        Ley 34/2002 (LSSI), pero te informamos de ellas.
      </p>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr><th>Nombre</th><th>Finalidad</th><th>Tipo</th><th>Titular</th><th>Duración</th></tr>
          </thead>
          <tbody>
            {COOKIES.map((c) => (
              <tr key={c.name}>
                <td><code>{c.name}</code></td>
                <td>{c.purpose}</td>
                <td>{c.type}</td>
                <td>Propia</td>
                <td>{c.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <strong>No usamos cookies analíticas, publicitarias ni de terceros.</strong> Si en el futuro las
        incorporamos, solo se activarán si das tu consentimiento en el panel de cookies, y actualizaremos esta
        política.
      </p>

      <h2>Cómo aceptar, rechazar o cambiar tu elección</h2>
      <p>
        La primera vez que entras te mostramos un aviso para aceptar, rechazar o configurar las cookies no
        necesarias. Rechazar es tan fácil como aceptar y puedes cambiar tu elección o retirar el consentimiento en
        cualquier momento:
      </p>
      <p><CookieSettingsButton className="btn btn-dark" /></p>
      <p>También puedes borrar o bloquear las cookies desde tu navegador:</p>
      <ul>
        {BROWSERS.map((b) => (
          <li key={b.name}>
            <a href={b.url} target="_blank" rel="noopener noreferrer">{b.name}</a>
          </li>
        ))}
      </ul>
      <p>
        Si bloqueas las cookies técnicas, no podrás iniciar sesión ni guardar cotizaciones.
      </p>

      <h2>Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política si cambian las cookies que usamos. Si el cambio afecta a cookies que
        necesitan consentimiento, te lo volveremos a pedir.
      </p>
    </article>
  );
}
