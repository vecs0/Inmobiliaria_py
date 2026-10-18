'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/v2/PropertyCard';
import { mapPropertiesFromApi, type V2Property } from '@/lib/property-adapter';
import { createClient } from '@/lib/supabase/client';

interface FavoritosClientProps {
  properties: V2Property[];
  userId?: string;
}

/** Favoritos del comprador. Fuente de verdad: GET /api/favorites → ids → properties_full. */
export function FavoritosClient({ properties }: FavoritosClientProps) {
  const [items, setItems] = useState<V2Property[]>(properties);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/favorites', { credentials: 'same-origin' });
        if (!res.ok) throw new Error(String(res.status));
        const { ids = [] } = (await res.json()) as { ids?: string[] };
        if (ids.length === 0) {
          if (!cancelled) setItems([]);
          return;
        }
        const supabase = createClient();
        const { data, error: qErr } = await supabase.from('properties_full').select('*').in('id', ids);
        if (qErr) throw qErr;
        const byId = new Map(mapPropertiesFromApi((data ?? []) as Record<string, unknown>[]).map((p) => [p.id, p]));
        // Mantener el orden devuelto por la API (más recientes primero)
        if (!cancelled) setItems(ids.map((id) => byId.get(id)).filter((p): p is V2Property => Boolean(p)));
      } catch {
        if (!cancelled) setError('No pudimos actualizar tus favoritos. Mostrando la última versión guardada.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleToggle(listingId: string, isFavorite: boolean) {
    if (!isFavorite) setItems((prev) => prev.filter((p) => p.id !== listingId));
  }

  if (loading && items.length === 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }} aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 360, borderRadius: 16, background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', opacity: 0.6 }} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden>♡</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 12 }}>Todavía no tenés favoritos</h2>
        <p style={{ color: 'var(--gray)', maxWidth: 400, margin: '0 auto 32px' }}>
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
      {error && (
        <p role="status" style={{ color: 'var(--gray)', fontSize: 13, marginBottom: 12 }}>
          {error}
        </p>
      )}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'var(--gray)', fontSize: 14 }}>
          {items.length} {items.length === 1 ? 'propiedad guardada' : 'propiedades guardadas'}
        </p>
        <Link href="/propiedades" style={{ color: 'var(--gold)', fontSize: 13, letterSpacing: '0.05em' }}>
          Explorar más →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        {items.map((p) => (
          <PropertyCard key={p.id} p={p} initialFavorite onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}
