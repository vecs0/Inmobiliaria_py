export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { PublicChrome } from '@/components/PublicChrome';
import { AlertasClient } from '@/components/v2/AlertasClient';
import { getUserContext } from '@/lib/auth/roles';
import { getUserSavedSearches } from '@/lib/supabase/saved-searches-actions';

export default async function AlertasPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect('/auth/login?redirect=/comprador/alertas');

  const alerts = await getUserSavedSearches();

  return (
    <main style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      <PublicChrome>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 80px' }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            <span /> COMPRADOR · ALERTAS <span />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: 8 }}>
            Tus alertas <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>activas.</span>
          </h1>
          <p style={{ color: 'var(--gray)', marginBottom: 40, maxWidth: 560 }}>
            Te notificamos por email cuando aparezca una propiedad que coincida con tus filtros.
          </p>
          <AlertasClient initialAlerts={alerts} />
        </div>
      </PublicChrome>
    </main>
  );
}
