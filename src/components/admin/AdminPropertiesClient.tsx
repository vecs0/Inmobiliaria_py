"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setListingStatusAdmin } from '@/app/admin/actions';

interface AdminPropertiesClientProps {
  listings: any[];
}

export function AdminPropertiesClient({ listings }: AdminPropertiesClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string, status: string) {
    setError(null);
    startTransition(async () => {
      const res = await setListingStatusAdmin(id, status === 'active' ? 'suspended' : 'active');
      if (!res.ok) setError(res.error ?? 'Error');
      else router.refresh();
    });
  }

  return (
    <>
    {error && <div style={{ color: '#F87171', marginBottom: 12, fontSize: 14 }}>{error}</div>}
    <div style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--gray-line)' }}>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Título</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Precio</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Operación</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Estado</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Vendedor</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Creado</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.id} style={{ borderBottom: '1px solid var(--gray-line)' }}>
              <td style={{ padding: '16px', color: 'var(--white)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {listing.title}
              </td>
              <td style={{ padding: '16px', color: 'var(--gold)', fontWeight: '500' }}>
                {listing.currency} {Number(listing.price).toLocaleString('es-PY')}
              </td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {listing.operation_type}
              </td>
              <td style={{ padding: '16px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: listing.status === 'active' ? '#10B98120' : '#F59E0B20',
                  color: listing.status === 'active' ? '#10B981' : '#F59E0B',
                }}>
                  {listing.status}
                </span>
              </td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {listing.seller_profiles?.company_name || listing.seller_profiles?.full_name || '-'}
              </td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {new Date(listing.created_at).toLocaleDateString('es-PY')}
              </td>
              <td style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/propiedades/${listing.id}`} target="_blank" style={{ padding: '6px 12px', background: 'var(--bg-dark)', border: '1px solid var(--gray-line)', borderRadius: '6px', color: 'var(--white)', fontSize: '12px', cursor: 'pointer', textDecoration: 'none' }}>
                    Ver
                  </Link>
                  <button type="button" disabled={pending} onClick={() => toggle(listing.id, listing.status)} style={{ padding: '6px 12px', background: 'var(--bg-dark)', border: '1px solid var(--gray-line)', borderRadius: '6px', color: 'var(--white)', fontSize: '12px', cursor: 'pointer' }}>
                    {listing.status === 'active' ? 'Suspender' : 'Activar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {listings.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray)' }}>
                No hay propiedades registradas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </>
  );
}
