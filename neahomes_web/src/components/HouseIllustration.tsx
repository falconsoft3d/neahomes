import type { Forma } from '@/lib/types';

type Props = {
  m2?: number;
  forma?: Forma;
  color?: string;
  showDimension?: boolean;
  className?: string;
};

const ROOF = '#1c1f24';
const FRAME = '#1c1f24';

/** Alzado frontal de la casa: el ancho depende de los m², la cubierta de la forma y el revestimiento del acabado. */
export default function HouseIllustration({
  m2 = 70,
  forma = 'dos_aguas',
  color = '#23272d',
  showDimension = true,
  className,
}: Props) {
  const ground = 430;
  const w = Math.max(240, Math.min(620, 260 + (m2 - 40) * 6));
  const x0 = 500 - w / 2;
  const x1 = 500 + w / 2;

  let wall: string;
  let roof: React.ReactNode;
  let wallTop: number;
  if (forma === 'un_agua') {
    wallTop = 262;
    wall = `${x0},226 ${x1},264 ${x1},${ground} ${x0},${ground}`;
    roof = <polygon points={`${x0 - 26},214 ${x1 + 26},256 ${x1 + 26},268 ${x0 - 26},226`} fill={ROOF} />;
  } else if (forma === 'plana' || forma === 'transitable') {
    // Plana: solo la losa. Transitable: losa con barandilla de cristal.
    wallTop = 272;
    wall = `${x0},272 ${x1},272 ${x1},${ground} ${x0},${ground}`;
    const posts = Array.from({ length: Math.round(w / 70) + 1 }, (_, i) => x0 + (i * w) / Math.round(w / 70));
    roof = (
      <g>
        {forma === 'transitable' && (
          <>
            <rect x={x0 + 4} y={226} width={w - 8} height={34} fill="#dfe8ec" opacity={0.7} />
            {posts.map((x) => (
              <rect key={x} x={x - 1.5} y={224} width={3} height={36} fill={FRAME} />
            ))}
            <rect x={x0} y={222} width={w} height={4} fill={FRAME} />
          </>
        )}
        <rect x={x0 - 14} y={258} width={w + 28} height={14} fill={ROOF} />
      </g>
    );
  } else {
    wallTop = 284;
    wall = `${x0},284 ${x1},284 ${x1},${ground} ${x0},${ground}`;
    roof = (
      <g>
        <polygon points={`${x0 - 30},288 500,192 ${x1 + 30},288`} fill={ROOF} />
        <polygon points={`${x0 - 30},288 ${x1 + 30},288 ${x1 + 22},294 ${x0 - 22},294`} fill="#0f1114" />
      </g>
    );
  }

  const doorW = Math.round(w * 0.36);
  const doorX = 500 - doorW / 2;
  const doorTop = Math.max(wallTop + 26, 306);
  const panels = Math.max(3, Math.round(doorW / 40));
  const winSize = 48;
  const winY = doorTop + 14;
  const windows = w >= 300 ? [x0 + w * 0.11, x1 - w * 0.11 - winSize] : [x0 + w * 0.08];
  // IDs derivados de las props: varias casas iguales en una página comparten defs idénticas.
  const uid = `nh-${forma}-${m2}-${color.replace(/[^a-z0-9]/gi, '')}`;
  const clipId = `${uid}-wall`;

  return (
    <svg viewBox="0 0 1000 500" className={className} role="img" aria-label={`Casa de ${m2} m²`}>
      <defs>
        <pattern id={`${uid}-boards`} width="14" height="10" patternUnits="userSpaceOnUse">
          <rect width="1.4" height="10" fill="#000" opacity="0.16" />
        </pattern>
        <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9e2e6" />
          <stop offset="0.55" stopColor="#9fb2bb" />
          <stop offset="1" stopColor="#6f838d" />
        </linearGradient>
        <radialGradient id={`${uid}-shadow`}>
          <stop offset="0" stopColor="#000" stopOpacity="0.16" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={clipId}>
          <polygon points={wall} />
        </clipPath>
      </defs>

      <line x1="40" x2="960" y1={ground + 1} y2={ground + 1} stroke="#e4e5e6" strokeWidth="2" />
      <ellipse cx="500" cy={ground + 4} rx={w / 2 + 80} ry="14" fill={`url(#${uid}-shadow)`} />

      <g key={`${forma}-${m2}-${color}`} className="house-fade">
        <polygon points={wall} fill={color} style={{ transition: 'fill .4s ease' }} />
        <rect x={x0} y={150} width={w} height={300} fill={`url(#${uid}-boards)`} clipPath={`url(#${clipId})`} />
        {roof}

        <rect x={doorX - 4} y={doorTop - 4} width={doorW + 8} height={ground - doorTop + 4} fill={FRAME} />
        <rect x={doorX} y={doorTop} width={doorW} height={ground - doorTop} fill={`url(#${uid}-glass)`} />
        {Array.from({ length: panels - 1 }, (_, i) => (
          <rect key={i} x={doorX + ((i + 1) * doorW) / panels - 1.5} y={doorTop} width={3} height={ground - doorTop} fill={FRAME} />
        ))}

        {windows.map((x) => (
          <g key={x}>
            <rect x={x - 4} y={winY - 4} width={winSize + 8} height={winSize + 8} fill={FRAME} />
            <rect x={x} y={winY} width={winSize} height={winSize} fill={`url(#${uid}-glass)`} />
            <rect x={x + winSize / 2 - 1.5} y={winY} width={3} height={winSize} fill={FRAME} />
          </g>
        ))}
        <rect x={x0 - 6} y={ground - 4} width={w + 12} height={6} fill="#15171b" />
      </g>

      {showDimension && (
        <g fill="#8a8d91" fontSize="15" fontFamily="inherit">
          <line x1={x0} x2={x1} y1={ground + 34} y2={ground + 34} stroke="#b9bbbe" />
          <line x1={x0} x2={x0} y1={ground + 27} y2={ground + 41} stroke="#b9bbbe" />
          <line x1={x1} x2={x1} y1={ground + 27} y2={ground + 41} stroke="#b9bbbe" />
          <text x="500" y={ground + 60} textAnchor="middle">{m2} m²</text>
        </g>
      )}
    </svg>
  );
}
