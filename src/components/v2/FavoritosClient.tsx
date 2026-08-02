'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/v2/PropertyCard';
import type { V2Property } from '@/lib/property-adapter';

interface FavoritosClientProps {
  properties: V2Property[];
  userId: string;
}

export function FavoritosClient({ properties, userId }: FavoritosClientProps) {
  const [items, setItems] = useState<V2Property[]>(properties);
  const [removing, setRemoving] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleRemove(propId: string) {
    setRemoving(propId);
    try {
      const res = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propId }),
      });
      if (res.ok) {
        startTransition(() => {
          setItems((prev) => prev.filter((p) => p.id !== propId && p.external_id !== propId));
        });
      }
    } finally {
      setRemoving(null);
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>♡</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 12 }}>
          Todavía no tenés favoritos
        </h2>
        <p style={{ color: 'var(--gray)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
          Cuando encuentres una propiedad que te guste, marcala con ♡ para guardarla acá.
        </p>
        <Link href="/propiedades" className="btn-gold">
          Explorar propiedades
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'var(--gray)', fontSize: 14 }}>
          {items.length} {items.length === 1 ? 'propiedad guardada' : 'propiedades guardadas'}
        </p>
        <Link href="/propiedades" style={{ color: 'var(--gold)', fontSize: 13, letterSpacing: '0.05em' }}>
          Explorar más →
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 24,
      }}>
        {items.map((p) => (
          <div key={p.id} style={{ position: 'relative' }}>
            <PropertyCard p={p} />
            <button
              onClick={() => handleRemove(p.external_id ?? p.id)}
              disabled={removing === (p.external_id ?? p.id)}
              aria-label="Quitar de favoritos"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'rgba(0,0,0,0.65)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                color: removing === (p.external_id ?? p.id) ? 'var(--gray)' : '#ff6b6b',
                padding: '6px 10px',
                fontSize: 18,
                cursor: removing ? 'not-allowed' : 'pointer',
                lineHeight: 1,
                backdropFilter: 'blur(6px)',
                transition: 'opacity 0.2s',
              }}
            >
              ♥
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
