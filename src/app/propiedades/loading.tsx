import type { CSSProperties } from 'react';

/* Skeleton del catálogo: barra de filtros + filas + panel de mapa. */
function block(h: number | string, w: number | string = '100%'): CSSProperties {
  return { height: h, width: w, borderRadius: 8, background: 'var(--bg-mid)', animation: 'impy-pulse 1.4s infinite ease-in-out' };
}

export default function LoadingPropiedades() {
  return (
    <main aria-busy="true" aria-label="Cargando propiedades" style={{ background: '#111111', minHeight: '100vh', paddingTop: 80 }}>
      <style>{`@keyframes impy-pulse{0%,100%{opacity:.35}50%{opacity:.8}}`}</style>
      <div style={{ display: 'flex', gap: 12, padding: '18px 32px', borderBottom: '1px solid var(--gray-line)', overflow: 'hidden' }}>
        {[120, 120, 140, 160, 120].map((w, i) => (
          <div key={i} style={block(40, w)} />
        ))}
      </div>
      <div className="listing-split">
        <section className="listing-results">
          <div style={{ ...block(28, 260), marginBottom: 24 }} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 20, padding: 16, border: '1px solid var(--gray-line)', borderRadius: 16 }}>
              <div style={block(150, 220)} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={block(14, '40%')} />
                <div style={block(22, '75%')} />
                <div style={block(14, '90%')} />
                <div style={block(14, '60%')} />
              </div>
            </div>
          ))}
        </section>
        <aside className="listing-map">
          <div style={{ ...block('100%'), borderRadius: 0 }} />
        </aside>
      </div>
    </main>
  );
}
