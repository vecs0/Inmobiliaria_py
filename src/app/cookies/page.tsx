import { PublicChrome } from '@/components/PublicChrome';

export default function CookiesPage() {
  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh', paddingTop: '100px', color: 'var(--text-main)', paddingBottom: '100px' }}>
      <PublicChrome>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '2rem' }}>Política de Cookies</h1>
          <p style={{ color: 'var(--gray)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Utilizamos cookies esenciales para mantener tu sesión activa y cookies de análisis para mejorar la plataforma.
          </p>
        </div>
      </PublicChrome>
    </main>
  );
}
