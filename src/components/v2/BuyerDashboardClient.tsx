'use client';

import Link from 'next/link';
import { PropertyCard } from '@/components/v2/PropertyCard';
import { mapPropertiesFromApi } from '@/lib/property-adapter';

export function BuyerDashboardClient({
  userName,
  featured = [],
}: {
  userName: string;
  featured?: Record<string, unknown>[];
}) {
  const items = mapPropertiesFromApi(featured);

  return (
    <div className="page-landing" style={{ paddingTop: 100, paddingBottom: 80 }}>
      <section className="section" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          <span /> TU ESPACIO · COMPRADOR <span />
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 12 }}>
          Hola, <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>{userName}</span>
        </h1>
        <p style={{ color: 'var(--gray)', maxWidth: 560, marginBottom: 48, lineHeight: 1.6 }}>
          Guardá favoritos, recibí alertas de nuevas oportunidades y seguí el mercado en las zonas que te interesan.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 56 }}>
          <DashCard id="favoritos" title="Favoritos" desc="Propiedades que marcaste para revisar después." action="Ver listado →" href="/comprador/favoritos" />
          <DashCard id="alertas" title="Alertas activas" desc="Te avisamos cuando aparece algo que coincide con tu búsqueda." action="Configurar alertas →" href="/comprador/alertas" />
          <DashCard id="busquedas" title="Vistos recientemente" desc="Las últimas propiedades que visitaste, para volver rápido." action="Ver historial →" href="/comprador/recientes" />
        </div>

        <div className="section-head" style={{ marginBottom: 32 }}>
          <h2>
            Recomendadas <span className="italic">para vos.</span>
          </h2>
        </div>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--gray-line)', borderRadius: 12 }}>
            <p style={{ color: 'var(--gray)', marginBottom: 20 }}>Todavía no hay propiedades destacadas para mostrarte.</p>
            <Link href="/propiedades" className="btn btn-gold">
              Explorar catálogo <span className="btn-arrow">→</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {items.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DashCard({
  id,
  title,
  desc,
  action,
  href,
}: {
  id: string;
  title: string;
  desc: string;
  action: string;
  href: string;
}) {
  return (
    <div
      id={id}
      style={{
        background: 'var(--bg-mid)',
        border: '1px solid var(--gray-line)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: 'var(--gray)', fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>{desc}</p>
      <Link href={href} style={{ color: 'var(--gold)', fontSize: 13, letterSpacing: '0.05em' }}>
        {action}
      </Link>
    </div>
  );
}
