import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      className="grain-bg"
      style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div style={{ maxWidth: 560, textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 20, justifyContent: 'center' }}>ERROR 404</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: 'clamp(2.4rem, 6vw, 4rem)', lineHeight: 1.05, marginBottom: 16 }}>
          Esta página <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>no existe.</span>
        </h1>
        <p style={{ color: 'var(--gray)', marginBottom: 36, lineHeight: 1.6 }}>
          Puede que la propiedad ya no esté disponible o que el enlace esté mal escrito.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/propiedades" className="btn btn-gold">
            Ver propiedades <span className="btn-arrow">→</span>
          </Link>
          <Link href="/" className="btn btn-ghost">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
