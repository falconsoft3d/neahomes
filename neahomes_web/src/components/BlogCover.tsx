type Props = { id: number; version: number; alt: string; width?: number; className?: string };

/** Imagen del artículo (subida en Odoo); si no tiene, un fondo neutro con el logotipo. */
export default function BlogCover({ id, version, alt, width = 1200, className }: Props) {
  if (!version) {
    return (
      <div className={`blog-cover blog-cover-empty${className ? ` ${className}` : ''}`} aria-hidden>
        <svg viewBox="0 0 32 32" width="40" height="40">
          <path d="M4 15 16 5l12 10v13h-7v-8h-10v8H4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/blog/image/${id}?v=${version}&w=${width}`}
      alt={alt}
      className={`blog-cover${className ? ` ${className}` : ''}`}
      loading="lazy"
      decoding="async"
    />
  );
}
