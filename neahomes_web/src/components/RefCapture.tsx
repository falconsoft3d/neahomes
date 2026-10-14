'use client';

import { useEffect } from 'react';
import { saveRef } from '@/lib/draft';

/** Guarda el código de un enlace de recomendación (?codigo=) sea cual sea la página de entrada. */
export default function RefCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('codigo')?.trim();
    if (code) saveRef(code.slice(0, 64));
  }, []);
  return null;
}
