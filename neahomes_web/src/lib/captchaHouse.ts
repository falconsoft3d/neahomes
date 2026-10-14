import 'server-only';
import { randomBytes, randomInt } from 'node:crypto';
import type { Forma } from './types';

const ROOF = '#1c1f24';
const FRAME = '#1c1f24';

/**
 * Casa en SVG (texto) para el captcha: misma geometría que HouseIllustration, pero sin React,
 * con ids aleatorios y pequeñas variaciones de posición para que no sea una plantilla fija.
 */
export function captchaHouseSvg(forma: Forma, m2: number, color: string) {
  const id = `c${randomBytes(5).toString('hex')}`;
  const j = () => randomInt(-6, 7); // variación de ± 6 px
  const ground = 430 + j();
  const w = Math.max(240, Math.min(620, 260 + (m2 - 40) * 6));
  const cx = 500 + j() * 3;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;

  let wall: string;
  let roof: string;
  let wallTop: number;
  if (forma === 'un_agua') {
    wallTop = 262;
    wall = `${x0},226 ${x1},264 ${x1},${ground} ${x0},${ground}`;
    roof = `<polygon points="${x0 - 26},214 ${x1 + 26},256 ${x1 + 26},268 ${x0 - 26},226" fill="${ROOF}"/>`;
  } else if (forma === 'plana' || forma === 'transitable') {
    wallTop = 272;
    wall = `${x0},272 ${x1},272 ${x1},${ground} ${x0},${ground}`;
    roof = `<rect x="${x0 - 14}" y="258" width="${w + 28}" height="14" fill="${ROOF}"/>`;
    if (forma === 'transitable') {
      const n = Math.round(w / 70);
      const posts = Array.from({ length: n + 1 }, (_, i) => x0 + (i * w) / n)
        .map((x) => `<rect x="${x - 1.5}" y="224" width="3" height="36" fill="${FRAME}"/>`)
        .join('');
      roof = `<rect x="${x0 + 4}" y="226" width="${w - 8}" height="34" fill="#dfe8ec" opacity="0.7"/>${posts}`
        + `<rect x="${x0}" y="222" width="${w}" height="4" fill="${FRAME}"/>${roof}`;
    }
  } else {
    wallTop = 284;
    wall = `${x0},284 ${x1},284 ${x1},${ground} ${x0},${ground}`;
    const peak = 192 + j();
    roof = `<polygon points="${x0 - 30},288 ${cx},${peak} ${x1 + 30},288" fill="${ROOF}"/>`
      + `<polygon points="${x0 - 30},288 ${x1 + 30},288 ${x1 + 22},294 ${x0 - 22},294" fill="#0f1114"/>`;
  }

  const doorW = Math.round(w * 0.36);
  const doorX = cx - doorW / 2 + j();
  const doorTop = Math.max(wallTop + 26, 306);
  const panels = Math.max(3, Math.round(doorW / 40));
  const win = 48;
  const winY = doorTop + 14;
  const windows = w >= 300 ? [x0 + w * 0.11, x1 - w * 0.11 - win] : [x0 + w * 0.08];
  const mullions = Array.from({ length: panels - 1 }, (_, i) =>
    `<rect x="${doorX + ((i + 1) * doorW) / panels - 1.5}" y="${doorTop}" width="3" height="${ground - doorTop}" fill="${FRAME}"/>`).join('');
  const wins = windows.map((x) =>
    `<rect x="${x - 4}" y="${winY - 4}" width="${win + 8}" height="${win + 8}" fill="${FRAME}"/>`
    + `<rect x="${x}" y="${winY}" width="${win}" height="${win}" fill="url(#${id}g)"/>`
    + `<rect x="${x + win / 2 - 1.5}" y="${winY}" width="3" height="${win}" fill="${FRAME}"/>`).join('');

  // Encuadre ajustado a la casa (con algo de margen variable) para que se vea grande en la casilla.
  const pad = 40 + randomInt(20);
  const top = 180 - randomInt(15);
  const viewBox = `${x0 - pad} ${top} ${w + pad * 2} ${ground + 16 - top}`;
  return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`
    + `<defs><pattern id="${id}b" width="14" height="10" patternUnits="userSpaceOnUse"><rect width="1.4" height="10" fill="#000" opacity="0.16"/></pattern>`
    + `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9e2e6"/><stop offset="0.55" stop-color="#9fb2bb"/><stop offset="1" stop-color="#6f838d"/></linearGradient>`
    + `<clipPath id="${id}w"><polygon points="${wall}"/></clipPath></defs>`
    + `<line x1="${x0 - pad}" x2="${x1 + pad}" y1="${ground + 1}" y2="${ground + 1}" stroke="#d9dadb" stroke-width="3"/>`
    + `<polygon points="${wall}" fill="${color}"/>`
    + `<rect x="${x0}" y="150" width="${w}" height="300" fill="url(#${id}b)" clip-path="url(#${id}w)"/>`
    + roof
    + `<rect x="${doorX - 4}" y="${doorTop - 4}" width="${doorW + 8}" height="${ground - doorTop + 4}" fill="${FRAME}"/>`
    + `<rect x="${doorX}" y="${doorTop}" width="${doorW}" height="${ground - doorTop}" fill="url(#${id}g)"/>`
    + mullions + wins
    + `<rect x="${x0 - 6}" y="${ground - 4}" width="${w + 12}" height="6" fill="#15171b"/>`
    + `</svg>`;
}
