import { PublicChrome } from '@/components/PublicChrome';

export default function PrivacidadPage() {
  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh', paddingTop: '100px', color: 'var(--text-main)', paddingBottom: '100px' }}>
      <PublicChrome>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '2rem' }}>Política de Privacidad</h1>
          <p style={{ color: 'var(--gray)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            En InmobiliariaPY, respetamos tu privacidad y protegemos tus datos personales conforme a la legislación vigente.
          </p>
          <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--gold)' }}>1. Recolección de Datos</h2>
          <p style={{ color: 'var(--gray)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Recolectamos información esencial (nombre, correo electrónico, teléfono) necesaria para el funcionamiento del servicio.
          </p>
        </div>
      </PublicChrome>
    </main>
  );
}
