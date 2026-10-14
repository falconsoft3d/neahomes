import Link from 'next/link';
import BlogCover from '@/components/BlogCover';
import { getBlog } from '@/lib/odoo';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog · NeaHomes', description: 'Novedades, consejos e ideas sobre casas prefabricadas.' };

type Props = { searchParams: Promise<{ categoria?: string }> };

export default async function BlogPage({ searchParams }: Props) {
  const { categoria } = await searchParams;
  const blog = await getBlog(categoria);

  return (
    <div className="blog">
      <header className="blog-head">
        <h1>Blog</h1>
        <p className="muted">Novedades, consejos e ideas para tu casa.</p>
      </header>

      {blog && blog.categories.length > 0 && (
        <nav className="blog-cats" aria-label="Categorías">
          <Link href="/blog" className={!categoria ? 'is-active' : ''} aria-current={!categoria ? 'page' : undefined}>
            Todas
          </Link>
          {blog.categories.map((c) => (
            <Link
              key={c.id}
              href={`/blog?categoria=${encodeURIComponent(c.slug)}`}
              className={categoria === c.slug ? 'is-active' : ''}
              aria-current={categoria === c.slug ? 'page' : undefined}
            >
              {c.name} <span>{c.count}</span>
            </Link>
          ))}
        </nav>
      )}

      {!blog ? (
        <p className="muted center">No pudimos cargar el blog. Inténtalo más tarde.</p>
      ) : blog.articles.length === 0 ? (
        <p className="muted center">Todavía no hay artículos{categoria ? ' en esta categoría' : ''}.</p>
      ) : (
        <div className="blog-grid">
          {blog.articles.map((a) => (
            <article key={a.id} className="blog-card">
              <Link href={`/blog/${a.slug}`} className="blog-card-link">
                <BlogCover id={a.id} version={a.image_version} alt={a.title} width={800} />
                <div className="blog-card-body">
                  <p className="blog-meta">
                    {a.category && <span className="blog-cat">{a.category.name}</span>}
                    {formatDate(a.date)}
                  </p>
                  <h2>{a.title}</h2>
                  {a.summary && <p className="muted">{a.summary}</p>}
                  <p className="blog-comments">
                    {a.comment_count === 1 ? '1 comentario' : `${a.comment_count} comentarios`}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
