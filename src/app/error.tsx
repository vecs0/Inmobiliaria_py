'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app error]', error);
  }, [error]);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div role="alert" style={{ maxWidth: 560, textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 20, justifyContent: 'center' }}>ALGO SALIÓ MAL</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(2rem, 5vw, 3.2rem)', lineHeight: 1.1, marginBottom: 16 }}>
          No pudimos cargar <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>esta página.</span>
        </h1>
        <p style={{ color: 'var(--gray)', marginBottom: 32, lineHeight: 1.6 }}>
          Probá de nuevo en unos segundos. Si el problema sigue, escribinos a{' '}
          <a href="mailto:contacto@inmobiliariapy.com" style={{ color: 'var(--gold)' }}>contacto@inmobiliariapy.com</a>.
          {error.digest && (
            <span style={{ display: 'block', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11 }}>Ref: {error.digest}</span>
          )}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-gold" onClick={() => reset()}>
            Reintentar <span className="btn-arrow">→</span>
          </button>
          <Link href="/" className="btn btn-ghost">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
