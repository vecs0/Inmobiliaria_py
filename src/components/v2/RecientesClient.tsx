'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/v2/PropertyCard';
import type { V2Property } from '@/lib/property-adapter';

interface RecientesClientProps {
  properties: V2Property[];
  isLoggedIn: boolean;
}

interface LocalStorageProperty {
  id: string;
  title: string;
  type: string;
  operation_type: string;
  price: number;
  currency: string;
  city: string;
  images: string[];
  viewedAt: string;
}

export function RecientesClient({ properties, isLoggedIn }: RecientesClientProps) {
  const [localProperties, setLocalProperties] = useState<LocalStorageProperty[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      // Load from localStorage for non-logged-in users
      const stored = localStorage.getItem('recently_viewed');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setLocalProperties(parsed);
        } catch (e) {
          console.error('Error parsing localStorage:', e);
        }
      }
    }
  }, [isLoggedIn]);

  const displayProperties = isLoggedIn ? properties : localProperties;

  if (displayProperties.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👁</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 12 }}>
          Aún no viste ninguna propiedad
        </h2>
        <p style={{ color: 'var(--gray)', maxWidth: 400, margin: '0 auto 32px' }}>
          {isLoggedIn 
            ? 'Cuando visites el detalle de una propiedad, la vas a ver acá para volver a ella rápido.'
            : 'Iniciá sesión para guardar tu historial de propiedades vistas.'
          }
        </p>
        <Link href={isLoggedIn ? '/propiedades' : '/auth/login'} className="btn-gold">
          {isLoggedIn ? 'Explorar propiedades' : 'Iniciar sesión'}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ color: 'var(--gray)', fontSize: 14 }}>
          Últimas {displayProperties.length} propiedades vistas
          {!isLoggedIn && ' (sesión actual)'}
        </p>
        <Link href="/propiedades" style={{ color: 'var(--gold)', fontSize: 13, letterSpacing: '0.05em' }}>
          Ver catálogo →
        </Link>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 24,
      }}>
        {displayProperties.map((p) => (
          <PropertyCard 
            key={isLoggedIn ? (p as V2Property).id : (p as LocalStorageProperty).id} 
            p={isLoggedIn ? p as V2Property : {
              id: (p as LocalStorageProperty).id,
              title: (p as LocalStorageProperty).title,
              type: (p as LocalStorageProperty).type,
              operation_type: (p as LocalStorageProperty).operation_type,
              price: (p as LocalStorageProperty).price,
              currency: (p as LocalStorageProperty).currency,
              city: (p as LocalStorageProperty).city,
              images: (p as LocalStorageProperty).images,
              bedrooms: 0,
              bathrooms: 0,
              sqm: 0,
              neighborhood: '',
              status: 'active',
              boosted: false,
              featured_until: null,
              latitude: 0,
              longitude: 0,
              loc: '',
              priceFormatted: '',
              priceN: 0,
              beds: '',
              baths: '',
              sqmLabel: '',
            } as unknown as V2Property} 
          />
        ))}
      </div>
    </div>
  );
}
