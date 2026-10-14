'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/format';
import type { UserDocument } from '@/lib/types';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt';
const MAX_BYTES = 4 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Documentos del cliente: se guardan en el historial (chatter) de su contacto en Odoo. */
export default function DocumentsSection({ documents: initial }: { documents: UserDocument[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initial);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        setError(`«${file.name}» supera el máximo de 4 MB.`);
        continue;
      }
      setUploading(file.name);
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/documents', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) return router.push('/login');
      if (!res.ok) setError(`«${file.name}»: ${data.error ?? 'no se pudo subir.'}`);
      else setDocuments(data.documents);
    }
    setUploading('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="profile-card documents">
      <div className="documents-head">
        <div>
          <h3>Documentos</h3>
          <p className="muted">Planos, escrituras de la parcela, DNI… PDF, imágenes, Word o Excel de hasta 4 MB.</p>
        </div>
        <label className={`btn btn-dark${uploading ? ' is-busy' : ''}`}>
          {uploading ? 'Subiendo…' : 'Adjuntar documento'}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            disabled={Boolean(uploading)}
            onChange={(e) => upload(e.target.files)}
            className="sr-only"
          />
        </label>
      </div>
      {uploading && <p className="muted" aria-live="polite">Subiendo «{uploading}»…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {documents.length === 0 ? (
        <p className="muted">Todavía no has subido documentos.</p>
      ) : (
        <ul className="documents-list">
          {documents.map((d) => (
            <li key={d.id}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path d="M6 3h8l4 4v14H6z M14 3v4h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className="documents-name">{d.name}</span>
              <span className="muted">{formatSize(d.size)} · {formatDate(d.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
