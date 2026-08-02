'use client';

import Link from 'next/link';
import { getPropertyPath } from '@/lib/property-adapter';
import type { V2Property } from '@/lib/property-adapter';
import { getStatusPill } from './dashboard-helpers';

type Row = V2Property & { views: number; leads: number };

export function SellerPropertiesClient({ listings }: { listings: Row[] }) {
  return (
  <>
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>INVENTARIO</div>
          <h1>
            Mis <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>propiedades.</span>
          </h1>
        </div>
        <Link href="/vendedor/propiedades/nueva" className="btn btn-gold" style={{ padding: '12px 20px', fontSize: 11 }}>
          + PUBLICAR NUEVA
        </Link>
      </div>

      <div className="dash-panel">
        <table className="list-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Propiedad</th>
              <th>Ubicación</th>
              <th>Op.</th>
              <th>Precio</th>
              <th>Vistas &amp; Leads</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ color: 'var(--gray)', padding: 32, textAlign: 'center' }}>
                  Todavía no publicaste propiedades.{' '}
                  <Link href="/vendedor/propiedades/nueva" style={{ color: 'var(--gold)' }}>
                    Publicar la primera →
                  </Link>
                </td>
              </tr>
            ) : (
              listings.map((p) => (
                <tr key={p.id}>
                  <td className="gold">{p.external_id || p.id}</td>
                  <td className="row-title">
                    <Link href={getPropertyPath(p)} style={{ color: 'inherit' }}>
                      {p.title}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--gray)' }}>{p.loc}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: p.operation_type === 'venta' ? 'var(--gold)' : '#7BA88F',
                        padding: '3px 8px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 4,
                      }}
                    >
                      {p.operation_type}
                    </span>
                  </td>
                  <td className="gold">{p.priceFormatted}</td>
                  <td>
                    {(p.views || 0).toLocaleString('es-PY')} · {p.leads || 0} leads
                  </td>
                  <td>{getStatusPill(p.status || 'active')}</td>
                  <td>
                    <Link
                      href={`/vendedor/propiedades/${p.id}/editar`}
                      style={{ fontSize: 12, color: 'var(--gray)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--gray-line)', borderRadius: 6, whiteSpace: 'nowrap' }}
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
