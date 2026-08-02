'use client';

import { PropertyCard } from '@/components/v2/PropertyCard';
import type { V2Property } from '@/lib/property-adapter';

export function RecomendadasClient({
  properties,
  hasHistory,
}: {
  properties: V2Property[];
  hasHistory: boolean;
}) {
  return (
    <div>
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>PARA VOS</div>
          <h1>
            Propiedades{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>recomendadas.</span>
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 14, marginTop: 8, maxWidth: 520 }}>
            {hasHistory
              ? 'Basado en las propiedades que visitaste y buscaste recientemente.'
              : 'Propiedades destacadas seleccionadas para vos.'}
          </p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="dash-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginBottom: 8 }}>
            Todavía no tenemos recomendaciones
          </h3>
          <p style={{ color: 'var(--gray)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Visitá algunas propiedades y volvé aquí para ver sugerencias personalizadas.
          </p>
          <a
            href="/propiedades"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: 'var(--gold)',
              color: '#0a0a0a',
              borderRadius: 8,
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.1em',
            }}
          >
            VER CATÁLOGO →
          </a>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
