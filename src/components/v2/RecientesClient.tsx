'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { PropertyCard } from '@/components/v2/PropertyCard';
import { mapPropertyFromApi, type V2Property } from '@/lib/property-adapter';

interface RecientesClientProps {
  properties: V2Property[];
  isLoggedIn: boolean;
}

/** Misma key que escribe DetailClient al ver una ficha. */
const RECENT_KEY = 'recent_listings';
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}
function getSnapshot(): string {
  try {
    return localStorage.getItem(RECENT_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}
function getServerSnapshot(): string | null {
  return null; // en SSR no hay localStorage
}

function parseHistory(raw: string | null): V2Property[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return Array.isArray(parsed) ? parsed.filter((r) => r && r.id).map((r) => mapPropertyFromApi(r)) : [];
  } catch {
    return [];
  }
}

export function RecientesClient({ properties, isLoggedIn }: RecientesClientProps) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const localProperties = useMemo(() => parseHistory(raw), [raw]);
  const ready = raw !== null;

  // Con login y datos del servidor → servidor. Si no, historial local de este dispositivo.
  const usingLocal = !(isLoggedIn && properties.length > 0);
  const displayProperties = usingLocal ? localProperties : properties;

  function clearLocal() {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* noop */
    }
    listeners.forEach((l) => l());
  }

  if (!ready && usingLocal) return null;

  if (displayProperties.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden>👁</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 12 }}>Aún no viste ninguna propiedad</h2>
        <p style={{ color: 'var(--gray)', maxWidth: 420, margin: '0 auto 32px' }}>
          Cuando visites el detalle de una propiedad, la vas a ver acá para volver a ella rápido.
          {!isLoggedIn && ' Iniciá sesión para sincronizar tu historial entre dispositivos.'}
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
          Últimas {displayProperties.length} propiedades vistas
          {usingLocal && ' (en este dispositivo)'}
        </p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {usingLocal && (
            <button type="button" onClick={clearLocal} style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: 13, cursor: 'pointer' }}>
              Borrar historial
            </button>
          )}
          <Link href="/propiedades" style={{ color: 'var(--gold)', fontSize: 13, letterSpacing: '0.05em' }}>
            Ver catálogo →
          </Link>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
        {displayProperties.map((p) => (
          <PropertyCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
