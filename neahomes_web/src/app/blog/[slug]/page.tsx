import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BlogCover from '@/components/BlogCover';
import CommentSection from '@/components/CommentSection';
import { getArticle, getToken } from '@/lib/odoo';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return { title: 'Artículo no encontrado · NeaHomes' };
  return { title: `${article.title} · NeaHomes`, description: article.summary || undefined };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const token = await getToken();
  const article = await getArticle(slug, token);
  if (!article) notFound();

  return (
    <article className="blog-article">
      <Link href="/blog" className="blog-back">← Blog</Link>
      <p className="blog-meta">
        {article.category && (
          <Link href={`/blog?categoria=${encodeURIComponent(article.category.slug)}`} className="blog-cat">
            {article.category.name}
          </Link>
        )}
        {formatDate(article.date)}
        {article.author && <> · {article.author}</>}
      </p>
      <h1>{article.title}</h1>
      {article.summary && <p className="blog-lead">{article.summary}</p>}
      {article.image_version > 0 && (
        <BlogCover id={article.id} version={article.image_version} alt={article.title} width={1600} className="blog-hero" />
      )}
      {/* Contenido escrito en Odoo (campo Html saneado por Odoo). */}
      <div className="legal-body blog-body" dangerouslySetInnerHTML={{ __html: article.body }} />

      <CommentSection
        slug={article.slug}
        comments={article.comments}
        loggedIn={Boolean(token)}
        allowComments={article.allow_comments}
      />
    </article>
  );
}
