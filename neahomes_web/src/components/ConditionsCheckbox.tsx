'use client';

import { forwardRef } from 'react';
import type { Conditions } from '@/lib/types';

type Props = { conditions: Conditions; checked: boolean; onChange: (checked: boolean) => void; id?: string };

/** Casilla obligatoria de aceptación; el enlace abre las condiciones en otra pestaña para no perder el diseño. */
const ConditionsCheckbox = forwardRef<HTMLInputElement, Props>(function ConditionsCheckbox(
  { conditions, checked, onChange, id = 'accept-conditions' },
  ref,
) {
  return (
    <label className="conditions-check" htmlFor={id}>
      <input ref={ref} id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
      <span>
        He leído y acepto las{' '}
        <a href="/condiciones" target="_blank" rel="noopener noreferrer">
          {conditions.name.toLowerCase()}
        </a>
        .
      </span>
    </label>
  );
});

export default ConditionsCheckbox;
