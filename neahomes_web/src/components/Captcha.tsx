'use client';

import { useCallback, useEffect, useState } from 'react';

type Challenge =
  | { mode: 'houses'; token: string; prompt: string; options: { id: string; svg: string }[] }
  | { mode: 'text'; token: string; prompt: string };

/**
 * Verificación anti-bots propia. Añade al formulario: captcha_token, captcha_answer y un campo trampa (website).
 * Cambia `resetKey` para pedir un reto nuevo (p. ej. tras un error al enviar).
 */
export default function Captcha({ resetKey = 0 }: { resetKey?: number }) {
  const [mode, setMode] = useState<'houses' | 'text'>('houses');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (m: 'houses' | 'text') => {
    setAnswer('');
    setPicked([]);
    setFailed(false);
    try {
      const res = await fetch(`/api/captcha?mode=${m}`, { cache: 'no-store' });
      setChallenge(await res.json());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load(mode);
  }, [mode, resetKey, load]);

  return (
    <fieldset className="captcha">
      <legend>Verificación</legend>
      {/* Campo trampa: invisible para personas, los bots suelen rellenarlo. */}
      <div className="captcha-trap" aria-hidden="true">
        <label>
          Web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name="captcha_token" value={challenge?.token ?? ''} />
      <input type="hidden" name="captcha_answer" value={challenge?.mode === 'houses' ? picked.join(',') : answer} />

      {failed && <p className="form-error">No se pudo cargar la verificación. <button type="button" className="link-button link" onClick={() => load(mode)}>Reintentar</button></p>}
      {!challenge && !failed && <p className="muted">Cargando verificación…</p>}

      {challenge && (
        <>
          <p className="captcha-prompt" id="captcha-prompt">{challenge.prompt}</p>
          {challenge.mode === 'houses' ? (
            <div className="captcha-grid" role="group" aria-labelledby="captcha-prompt">
              {challenge.options.map((o, i) => (
                <button
                  key={o.id}
                  type="button"
                  role="checkbox"
                  aria-checked={picked.includes(o.id)}
                  aria-label={`Casa ${i + 1}`}
                  className={`captcha-option${picked.includes(o.id) ? ' is-selected' : ''}`}
                  onClick={() => setPicked((p) => (p.includes(o.id) ? p.filter((x) => x !== o.id) : [...p, o.id]))}
                  // SVG generado por nuestro servidor (no contiene datos del usuario).
                  dangerouslySetInnerHTML={{ __html: o.svg }}
                />
              ))}
            </div>
          ) : (
            <input
              className="captcha-text"
              inputMode="numeric"
              autoComplete="off"
              aria-labelledby="captcha-prompt"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/\D/g, '').slice(0, 3))}
              required
            />
          )}
          <div className="captcha-actions">
            <button type="button" className="link-button" onClick={() => load(mode)}>Otra</button>
            <button type="button" className="link-button" onClick={() => setMode(mode === 'houses' ? 'text' : 'houses')}>
              {mode === 'houses' ? 'Usar una pregunta de texto' : 'Usar imágenes'}
            </button>
          </div>
        </>
      )}
    </fieldset>
  );
}
