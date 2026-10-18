'use client';

/* Error en el root layout: los estilos globales pueden no estar disponibles, todo va inline. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#0e0e0e', color: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div role="alert" style={{ maxWidth: 520, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.25em', color: '#B8922A', marginBottom: 20 }}>ERROR</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 36, margin: '0 0 16px' }}>
              InmobiliariaPY no está disponible en este momento.
            </h1>
            <p style={{ color: '#9a9a9a', lineHeight: 1.6, marginBottom: 32 }}>
              Estamos trabajando para resolverlo. Probá de nuevo en unos minutos.
              {error.digest && (
                <span style={{ display: 'block', marginTop: 8, fontFamily: 'monospace', fontSize: 11 }}>Ref: {error.digest}</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{ background: '#B8922A', color: '#0e0e0e', border: 'none', borderRadius: 999, padding: '12px 28px', fontSize: 14, cursor: 'pointer' }}
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
