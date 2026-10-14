'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/format';
import type { BlogComment } from '@/lib/types';

type Props = { slug: string; comments: BlogComment[]; loggedIn: boolean; allowComments: boolean };

/** Comentarios del artículo: todos los leen; solo los usuarios registrados pueden escribir. */
export default function CommentSection({ slug, comments: initial, loggedIn, allowComments }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState(initial);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const here = `/blog/${slug}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError('');
    setSending(true);
    const res = await fetch(`/api/blog/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (res.status === 401) return router.push(`/login?next=${encodeURIComponent(here)}`);
    if (!res.ok) return setError(data.error ?? 'No se pudo publicar el comentario.');
    setComments(data.article.comments);
    setText('');
  }

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title">Comentarios {comments.length > 0 && <span className="muted">({comments.length})</span>}</h2>

      {comments.length === 0 ? (
        <p className="muted">Todavía no hay comentarios.</p>
      ) : (
        <ol className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className={`comment${c.mine ? ' is-mine' : ''}`}>
              <div className="comment-meta">
                <strong>{c.mine ? 'Tú' : c.author}</strong> · {formatDate(c.date)}
              </div>
              <p>{c.body}</p>
            </li>
          ))}
        </ol>
      )}

      {!allowComments ? (
        <p className="muted">Los comentarios están cerrados en este artículo.</p>
      ) : loggedIn ? (
        <form className="comment-form" onSubmit={submit}>
          <label htmlFor="comment-body">Escribe un comentario</label>
          <textarea
            id="comment-body"
            rows={4}
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-dark" disabled={sending || !text.trim()}>
            {sending ? 'Publicando…' : 'Publicar comentario'}
          </button>
        </form>
      ) : (
        <div className="comment-login">
          <p>Para comentar necesitas una cuenta.</p>
          <div>
            <Link href={`/login?next=${encodeURIComponent(here)}`} className="btn btn-dark">Iniciar sesión</Link>
            <Link href="/registro" className="btn btn-light">Crear cuenta</Link>
          </div>
        </div>
      )}
    </section>
  );
}
