"use client";

import React from 'react';

interface AdminPropertiesClientProps {
  listings: any[];
}

export function AdminPropertiesClient({ listings }: AdminPropertiesClientProps) {
  return (
    <div style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: '12px', overflow: 'hidden' }}>
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
                {listing.seller_profiles?.company_name || '-'}
              </td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {new Date(listing.created_at).toLocaleDateString('es-PY')}
              </td>
              <td style={{ padding: '16px' }}>
                <button style={{ padding: '6px 12px', background: 'var(--bg-dark)', border: '1px solid var(--gray-line)', borderRadius: '6px', color: 'var(--white)', fontSize: '12px', cursor: 'pointer' }}>
                  Ver
                </button>
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
  );
}
