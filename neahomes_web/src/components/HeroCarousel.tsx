'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import StarTrail from './StarTrail';
import type { Slide } from '@/lib/types';

const AUTOPLAY_MS = 6000;

/** Carrusel de portada al estilo Tesla: imagen a pantalla completa, título arriba, dos botones, flechas y puntos. */
export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const go = useCallback((i: number) => setIndex((i + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, count, go]);

  const current = slides[index];

  return (
    <section
      className={`carousel theme-${current.theme}`}
      aria-roledescription="carrusel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`carousel-slide${i === index ? ' is-active' : ''}`}
          aria-hidden={i !== index}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} de ${count}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/slides/${s.id}/image?v=${s.image_version}&w=2560`}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'auto'}
          />
        </div>
      ))}

      <StarTrail />

      <div className="carousel-copy" key={current.id}>
        <h1>{current.title}</h1>
        {current.subtitle && <p>{current.subtitle}</p>}
        <div className="carousel-actions">
          {current.button1_text && (
            <Link href={current.button1_url || '/encargar'} className="btn btn-primary">{current.button1_text}</Link>
          )}
          {current.button2_text && (
            <Link href={current.button2_url || '/'} className="btn btn-white">{current.button2_text}</Link>
          )}
        </div>
      </div>

      {count > 1 && (
        <>
          <button type="button" className="carousel-arrow prev" onClick={() => go(index - 1)} aria-label="Anterior">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          </button>
          <button type="button" className="carousel-arrow next" onClick={() => go(index + 1)} aria-label="Siguiente">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          </button>
          <div className="carousel-dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={i === index ? 'is-active' : ''}
                onClick={() => go(i)}
                aria-label={`Ir al slide ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
