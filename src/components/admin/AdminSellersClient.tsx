"use client";

import React from 'react';

interface AdminSellersClientProps {
  sellers: any[];
}

export function AdminSellersClient({ sellers }: AdminSellersClientProps) {
  return (
    <div style={{ background: 'var(--bg-mid)', border: '1px solid var(--gray-line)', borderRadius: '12px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--gray-line)' }}>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Empresa</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Email</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Tipo</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Plan</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Estado</th>
            <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: 'var(--gray)', textTransform: 'uppercase' }}>Creado</th>
                      </tr>
        </thead>
        <tbody>
          {sellers.map((seller) => (
            <tr key={seller.id} style={{ borderBottom: '1px solid var(--gray-line)' }}>
              <td style={{ padding: '16px', color: 'var(--white)', fontWeight: '500' }}>
                {seller.company_name || seller.full_name || '-'}
              </td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {seller.email || '-'}
              </td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {seller.seller_type}
              </td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {seller.subscription_plan || '-'} · {seller.properties_count ?? 0}/{seller.max_properties ?? '∞'}
              </td>
              <td style={{ padding: '16px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: '#10B98120',
                  color: '#10B981',
                }}>
                  {seller.subscription_status || '-'}
                </span>
              </td>
              <td style={{ padding: '16px', color: 'var(--gray)', fontSize: '14px' }}>
                {new Date(seller.created_at).toLocaleDateString('es-PY')}
              </td>
            </tr>
          ))}
          {sellers.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray)' }}>
                No hay vendedores registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
