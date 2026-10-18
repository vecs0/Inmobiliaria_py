'use client';

import dynamic from 'next/dynamic';

export type { MapItem } from './PropertiesMap';

/** Mapa Leaflet cargado solo en cliente (Leaflet accede a `window`). */
export const PropertiesMapDynamic = dynamic(() => import('./PropertiesMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{ width: '100%', height: '100%', minHeight: 240, background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em' }}
    >
      CARGANDO MAPA…
    </div>
  ),
});
