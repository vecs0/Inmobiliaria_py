import { PublicChrome } from '@/components/PublicChrome';

export default function TerminosPage() {
  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh', paddingTop: '100px', color: 'var(--text-main)', paddingBottom: '100px' }}>
      <PublicChrome>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginBottom: '2rem' }}>Términos y Condiciones</h1>
          <p style={{ color: 'var(--gray)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Bienvenido a InmobiliariaPY. Al utilizar nuestra plataforma, aceptas estos términos y condiciones.
          </p>
          <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--gold)' }}>1. Uso del Servicio</h2>
          <p style={{ color: 'var(--gray)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            La plataforma es de uso exclusivo para la publicación y búsqueda de propiedades dentro del territorio de Paraguay.
          </p>
          <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', color: 'var(--gold)' }}>2. Publicaciones</h2>
          <p style={{ color: 'var(--gray)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Los usuarios son responsables de la veracidad de la información publicada y deben garantizar que poseen los derechos de las imágenes utilizadas.
          </p>
          {/* Add more placeholder text as needed */}
        </div>
      </PublicChrome>
    </main>
  );
}
