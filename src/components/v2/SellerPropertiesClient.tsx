'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPropertyPath, getPropertyRef } from '@/lib/property-adapter';
import type { V2Property } from '@/lib/property-adapter';
import { deleteListing, setListingStatus } from '@/lib/actions/properties';
import { getStatusPill } from './dashboard-helpers';

type Row = V2Property & { views: number; leads: number };

const PAGE_SIZE = 15;

const actionBtn: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--gray)',
  background: 'none',
  textDecoration: 'none',
  padding: '4px 10px',
  border: '1px solid var(--gray-line)',
  borderRadius: 6,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

export function SellerPropertiesClient({ listings }: { listings: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(listings);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'other'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRow, setConfirmRow] = useState<Row | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        filter === 'all' ? true : filter === 'other' ? r.status !== 'active' && r.status !== 'paused' : r.status === filter
      ),
    [rows, filter]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function toggleStatus(r: Row) {
    const next = r.status === 'active' ? 'paused' : 'active';
    setBusyId(r.id);
    setMessage(null);
    const res = await setListingStatus(r.id, next);
    setBusyId(null);
    if (!res.ok) {
      setMessage({ type: 'error', text: res.error ?? 'No se pudo cambiar el estado.' });
      return;
    }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
    setMessage({ type: 'ok', text: next === 'active' ? 'Propiedad activada.' : 'Propiedad pausada.' });
    startTransition(() => router.refresh());
  }

  async function confirmDelete() {
    if (!confirmRow) return;
    const r = confirmRow;
    setBusyId(r.id);
    setMessage(null);
    const res = await deleteListing(r.id);
    setBusyId(null);
    setConfirmRow(null);
    if (!res.ok) {
      setMessage({ type: 'error', text: res.error ?? 'No se pudo eliminar la propiedad.' });
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    setMessage({ type: 'ok', text: 'Propiedad eliminada.' });
    startTransition(() => router.refresh());
  }

  const counts = {
    all: rows.length,
    active: rows.filter((r) => r.status === 'active').length,
    paused: rows.filter((r) => r.status === 'paused').length,
    other: rows.filter((r) => r.status !== 'active' && r.status !== 'paused').length,
  };

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

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }} role="group" aria-label="Filtrar por estado">
        {([
          ['all', 'Todas'],
          ['active', 'Activas'],
          ['paused', 'Pausadas'],
          ['other', 'Otras'],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => {
              setFilter(k);
              setPage(1);
            }}
            style={{
              ...actionBtn,
              color: filter === k ? '#0e0e0e' : 'var(--gray)',
              background: filter === k ? 'var(--gold)' : 'none',
              borderColor: filter === k ? 'var(--gold)' : 'var(--gray-line)',
            }}
          >
            {l} ({counts[k]})
          </button>
        ))}
      </div>

      {message && (
        <p role={message.type === 'error' ? 'alert' : 'status'} style={{ color: message.type === 'error' ? '#ef4444' : 'var(--gold-light)', fontSize: 13, marginBottom: 12 }}>
          {message.text}
        </p>
      )}

      <div className="dash-panel" style={{ overflowX: 'auto' }}>
        <table className="list-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Propiedad</th>
              <th>Ubicación</th>
              <th>Op.</th>
              <th>Precio</th>
              <th>Vistas (30d) · Leads</th>
              <th>Estado</th>
              <th><span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ color: 'var(--gray)', padding: 32, textAlign: 'center' }}>
                  {rows.length === 0 ? (
                    <>
                      Todavía no publicaste propiedades.{' '}
                      <Link href="/vendedor/propiedades/nueva" style={{ color: 'var(--gold)' }}>
                        Publicar la primera →
                      </Link>
                    </>
                  ) : (
                    'No hay propiedades con este estado.'
                  )}
                </td>
              </tr>
            ) : (
              pageRows.map((p) => {
                const canToggle = p.status === 'active' || p.status === 'paused';
                const busy = busyId === p.id;
                return (
                  <tr key={p.id} style={{ opacity: busy ? 0.5 : 1 }}>
                    <td className="gold">{getPropertyRef(p)}</td>
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
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/vendedor/propiedades/${p.id}/editar`} style={actionBtn}>
                          Editar
                        </Link>
                        {canToggle && (
                          <button type="button" style={actionBtn} disabled={busy} onClick={() => toggleStatus(p)}>
                            {p.status === 'active' ? 'Pausar' : 'Activar'}
                          </button>
                        )}
                        <button
                          type="button"
                          style={{ ...actionBtn, color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
                          disabled={busy}
                          onClick={() => setConfirmRow(p)}
                          aria-label={`Eliminar ${p.title}`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <nav className="pagination" aria-label="Paginación" style={{ marginTop: 16 }}>
            <button type="button" className="chip" disabled={current <= 1} onClick={() => setPage(current - 1)} style={{ opacity: current <= 1 ? 0.4 : 1 }}>
              ← Anterior
            </button>
            <span>
              página {current} / {totalPages}
            </span>
            <button type="button" className="chip" disabled={current >= totalPages} onClick={() => setPage(current + 1)} style={{ opacity: current >= totalPages ? 0.4 : 1 }}>
              Siguiente →
            </button>
          </nav>
        )}
      </div>

      {confirmRow && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          onKeyDown={(e) => e.key === 'Escape' && setConfirmRow(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
        >
          <div className="dash-panel" style={{ maxWidth: 440, width: '100%', margin: 0 }}>
            <h3 id="confirm-delete-title" style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 12 }}>
              ¿Eliminar esta propiedad?
            </h3>
            <p style={{ color: 'var(--gray)', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              Vas a eliminar <strong style={{ color: 'var(--white)' }}>{confirmRow.title}</strong>. Esta acción no se puede deshacer.
              Si solo querés ocultarla, podés pausarla.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" style={actionBtn} onClick={() => setConfirmRow(null)} autoFocus>
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busyId === confirmRow.id}
                style={{ ...actionBtn, background: '#ef4444', color: '#fff', borderColor: '#ef4444' }}
              >
                {busyId === confirmRow.id ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
