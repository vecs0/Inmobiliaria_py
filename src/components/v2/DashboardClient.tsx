'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BOOST_PLANS } from '@/lib/stripe/boost-plans';
import type { DashboardClientProps } from './dashboard-types';
import { ChartViewsLeads, getStatusPill, LeadRow, Sparkline, type SeriesPoint } from './dashboard-helpers';
import { getPropertyPath, getPropertyRef } from '@/lib/property-adapter';

export type { DashboardClientProps } from './dashboard-types';

export function DashboardClient({
  user,
  stats,
  recentLeads,
  unreadLeads,
  listings,
  plan,
  series = [],
}: DashboardClientProps & { series?: SeriesPoint[] }) {
  const [boostLoading, setBoostLoading] = useState<string | null>(null);
  const [boostTarget, setBoostTarget] = useState<string>(
    () => (listings.find((l) => l.status === 'active') ?? listings[0])?.id ?? ''
  );
  const [boostError, setBoostError] = useState<string | null>(null);
  const firstName = user.name.toUpperCase().split(' ')[0];
  const activeListings = listings.filter((l) => l.status === 'active');

  // Tendencias reales desde la serie diaria
  const last7 = series.slice(-7);
  const prev7 = series.slice(-14, -7);
  const sum = (arr: SeriesPoint[], k: 'views' | 'leads') => arr.reduce((a, p) => a + p[k], 0);
  const views7 = sum(last7, 'views');
  const viewsPrev7 = sum(prev7, 'views');
  const leads30 = sum(series, 'leads');
  const viewsUp: boolean | null = series.length >= 14 ? views7 >= viewsPrev7 : null;

  async function handleBoostCheckout(planKey: string) {
    setBoostError(null);
    if (!boostTarget) {
      setBoostError('Publicá al menos una propiedad antes de destacar.');
      return;
    }
    setBoostLoading(planKey);
    try {
      const res = await fetch('/api/stripe/boost-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: boostTarget, planKey }),
      });
      const json = await res.json();
      if (json.url) window.location.assign(json.url);
      else setBoostError(json.error || 'No se pudo iniciar el pago');
    } catch {
      setBoostError('Error de conexión con Stripe');
    } finally {
      setBoostLoading(null);
    }
  }

  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            HOLA, {firstName}
          </div>
          <h1>
            Resumen de la <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>semana.</span>
          </h1>
        </div>
        <div className="user-pill">
          <span>{user.name}</span>
          <span
            className="avatar"
            style={
              user.avatarUrl
                ? { backgroundImage: `url(${user.avatarUrl})`, backgroundSize: 'cover' }
                : undefined
            }
          />
        </div>
      </div>

      <div className="stats-row">
        {[
          {
            k: 'Vistas (7d)',
            v: (series.length ? views7 : stats.views_7d).toLocaleString('es-PY'),
            d: viewsUp === null ? 'últimos 7 días' : `vs. ${viewsPrev7.toLocaleString('es-PY')} semana anterior`,
            up: viewsUp,
            data: series.map((p) => p.views),
          },
          {
            k: 'Consultas totales',
            v: stats.leads_total.toLocaleString('es-PY'),
            d: series.length ? `${leads30} en 30 días` : 'acumulado',
            up: null as boolean | null,
            data: series.map((p) => p.leads),
          },
          { k: 'Propiedades activas', v: String(activeListings.length || stats.active_properties), d: `de ${plan.maxCount} máx.`, up: null as boolean | null, data: undefined as number[] | undefined },
          { k: 'Conversión', v: `${stats.conversion_rate}%`, d: 'vistas → leads (30d)', up: null as boolean | null, data: undefined as number[] | undefined },
        ].map((s) => (
          <div key={s.k} className="stat-card">
            <div className="k">{s.k}</div>
            <div className="v">{s.v}</div>
            <div className={`delta ${s.up === true ? 'up' : s.up === false ? 'dn' : ''}`}>
              {s.up !== null && <span aria-hidden>{s.up ? '↗' : '↘'}</span>} {s.d}
            </div>
            {s.data && <Sparkline up={s.up !== false} data={s.data} />}
          </div>
        ))}
      </div>

      <div className="dash-row">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Vistas & consultas</h3>
            <div className="meta">ÚLTIMOS 30 DÍAS</div>
          </div>
          <ChartViewsLeads series={series} />
          <div className="legend">
            <span>
              <span className="swatch" /> Vistas
            </span>
            <span>
              <span className="swatch b" /> Consultas
            </span>
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Consultas calientes</h3>
            <Link href="/vendedor/leads" className="meta" style={{ color: 'var(--gold)' }}>
              {unreadLeads > 0 ? `${unreadLeads} sin leer` : 'VER TODAS →'}
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentLeads.length === 0 ? (
              <p style={{ color: 'var(--gray)', fontSize: 13, padding: 16 }}>Sin consultas todavía.</p>
            ) : (
              recentLeads.map((l, i) => <LeadRow key={l.id} l={l} last={i === recentLeads.length - 1} />)
            )}
          </div>
        </div>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <div>
            <h3>Destacar propiedades</h3>
            <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4 }}>
              Aumentá la visibilidad de tus mejores propiedades.
            </div>
          </div>
          <div className="meta">STRIPE · PAGOS SEGUROS</div>
        </div>
        {listings.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <label htmlFor="boost-target" style={{ fontSize: 12, color: 'var(--gray)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
              PROPIEDAD A DESTACAR
            </label>
            <select
              id="boost-target"
              value={boostTarget}
              onChange={(e) => setBoostTarget(e.target.value)}
              style={{ background: 'var(--bg-dark)', color: 'var(--white)', border: '1px solid var(--gray-line)', borderRadius: 8, padding: '8px 10px', minWidth: 240 }}
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>
        )}
        {boostError && (
          <p role="alert" style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>
            {boostError}
          </p>
        )}
        <div className="boost-grid">
          {BOOST_PLANS.map((bp) => (
            <div key={bp.key} className={`boost-plan ${bp.recommended ? 'recommended' : ''}`}>
              {bp.recommended && <div className="boost-rec">★ Recomendado</div>}
              <div className="boost-plan-label">{bp.label}</div>
              <div className="boost-plan-price">
                <span className="amount">USD {bp.priceUsd}</span>
                <span className="per">/{bp.days}d</span>
              </div>
              <ul className="boost-features">
                {bp.features.map((f, i) => (
                  <li key={i}>
                    <span className="check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`boost-cta ${bp.recommended ? 'primary' : ''}`}
                disabled={boostLoading !== null}
                onClick={() => handleBoostCheckout(bp.key)}
              >
                {boostLoading === bp.key ? 'Redirigiendo…' : 'Activar destacado'}{' '}
                <span style={{ marginLeft: 6 }}>→</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h3>Mis propiedades</h3>
          <Link href="/vendedor/propiedades/nueva" className="btn btn-gold" style={{ padding: '10px 18px', fontSize: 11 }}>
            + Publicar nueva
          </Link>
        </div>
        <table className="list-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Propiedad</th>
              <th>Ubicación</th>
              <th>Op.</th>
              <th>Precio</th>
              <th>Vistas (30d)</th>
              <th>Leads</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--gray)' }}>
                  No tenés propiedades publicadas. ¡Publicá la primera!
                </td>
              </tr>
            ) : (
              listings.slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td className="gold">{getPropertyRef(p)}</td>
                  <td className="row-title"><Link href={getPropertyPath(p)} style={{ color: 'inherit' }}>{p.title}</Link></td>
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
                  <td>{p.views.toLocaleString('es-PY')}</td>
                  <td>{p.leads}</td>
                  <td>{getStatusPill(p.status ?? 'pending')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {listings.length > 10 && (
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Link href="/vendedor/propiedades" style={{ color: 'var(--gold)', fontSize: 13 }}>
              Ver las {listings.length} propiedades →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
