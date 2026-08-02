import { Suspense } from 'react';
import { DestacadosV2Client } from '@/components/v2/DestacadosV2Client';

export default function DestacadosPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray)' }}>Cargando…</div>
      }
    >
      <DestacadosV2Client />
    </Suspense>
  );
}
