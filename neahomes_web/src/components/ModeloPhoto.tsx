type Props = { id: number; version: number; alt: string; width?: number; className?: string };

/** Foto del modelo subida en Odoo (solo se usa cuando version > 0, es decir, si hay imagen). */
export default function ModeloPhoto({ id, version, alt, width = 1200, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/modelos/${id}/image?v=${version}&w=${width}`}
      alt={alt}
      className={`modelo-photo${className ? ` ${className}` : ''}`}
      loading="lazy"
      decoding="async"
    />
  );
}
