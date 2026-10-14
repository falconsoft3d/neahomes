'use client';

import { useEffect, useRef } from 'react';

type Star = { x: number; y: number; vx: number; vy: number; size: number; life: number; spin: number; angle: number };

const MAX_STARS = 120;
const LIFE = 900; // ms

/** Estela de destellos que sigue al ratón dentro de su contenedor (el carrusel). Solo decorativa. */
export default function StarTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    // Sin animación si el usuario lo ha pedido o en pantallas táctiles (no hay «pasar el ratón»).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: Star[] = [];
    let frame = 0;
    let last = performance.now();
    let lastSpawn = { x: -1, y: -1 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = host.clientWidth * dpr;
      canvas.height = host.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    const sparkle = (s: Star, alpha: number) => {
      const r = s.size;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = 'rgba(255, 236, 170, 0.9)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fff';
      // Estrella de cuatro puntas.
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.18, -r * 0.18, r, 0);
      ctx.quadraticCurveTo(r * 0.18, r * 0.18, 0, r);
      ctx.quadraticCurveTo(-r * 0.18, r * 0.18, -r, 0);
      ctx.quadraticCurveTo(-r * 0.18, -r * 0.18, 0, -r);
      ctx.fill();
      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      ctx.clearRect(0, 0, host.clientWidth, host.clientHeight);
      stars = stars.filter((s) => (s.life -= dt) > 0);
      for (const s of stars) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 0.00004 * dt; // caen un poco
        s.angle += s.spin * dt;
        const t = s.life / LIFE;
        sparkle(s, Math.min(1, t * 1.6));
      }
      frame = stars.length ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Una estrella cada pocos píxeles de recorrido, para que la estela no dependa de la velocidad.
      if (Math.hypot(x - lastSpawn.x, y - lastSpawn.y) < 10) return;
      lastSpawn = { x, y };
      for (let i = 0; i < 2; i++) {
        stars.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 0.04,
          vy: (Math.random() - 0.5) * 0.04 + 0.01,
          size: 3 + Math.random() * 6,
          life: LIFE * (0.6 + Math.random() * 0.4),
          spin: (Math.random() - 0.5) * 0.004,
          angle: Math.random() * Math.PI,
        });
      }
      if (stars.length > MAX_STARS) stars = stars.slice(-MAX_STARS);
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    host.addEventListener('mousemove', onMove);
    return () => {
      host.removeEventListener('mousemove', onMove);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="star-trail" aria-hidden />;
}
