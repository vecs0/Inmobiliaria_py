import React from 'react';
import Link from 'next/link';
import { getOverallStats, getPropertyAnalytics, getViewsTrend30d, getViewsLeadsSeries } from '@/lib/supabase/analytics-actions';
import { getPropertyPath } from '@/lib/property-adapter';
import { ChartViewsLeads, Sparkline } from '@/components/v2/dashboard-helpers';

function AnalyticsTrendChart({ data }: { data: { date: string; views: number }[] }) {
  const max = Math.max(...data.map((d) => d.views), 1);
  const W = 660;
  const H = 180;
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: H - (d.views / max) * (H - 12) - 6,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${W},${H} L0,${H} Z`;

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H + 24}`} preserveAspectRatio="none" style={{ width: '100%' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1="0"
          y1={(H - t * (H - 12) - 6).toFixed(1)}
          x2={W}
          y2={(H - t * (H - 12) - 6).toFixed(1)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      <path d={areaD} fill="url(#analyticsGrad)" opacity="0.2" />
      <defs>
        <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7BA88F" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#7BA88F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={pathD} fill="none" stroke="var(--gold)" strokeWidth="1.6" />
    </svg>
  );
}

export default async function AnalyticsPage() {
  const [stats, properties, trend, series] = await Promise.all([
    getOverallStats(),
    getPropertyAnalytics(),
    getViewsTrend30d(),
    getViewsLeadsSeries(30).catch(() => []),
  ]);

  const half = Math.floor(trend.length / 2);
  const prevViews = trend.slice(0, half).reduce((s, d) => s + d.views, 0);
  const currViews = trend.slice(half).reduce((s, d) => s + d.views, 0);
  const trendUp = currViews >= prevViews;

  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            MÉTRICAS · 30 DÍAS
          </div>
          <h1>
            Analítica de tus <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>propiedades.</span>
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 14, marginTop: 8 }}>
            Rendimiento de vistas, consultas y conversión.
          </p>
        </div>
        {stats.top_property_title && (
          <div
            style={{
              background: 'rgba(123,168,143,0.1)',
              border: '1px solid rgba(123,168,143,0.3)',
              borderRadius: 10,
              padding: '12px 18px',
              maxWidth: 240,
            }}
          >
            <p style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--gold)', marginBottom: 4 }}>
              TOP PROPIEDAD
            </p>
            <p style={{ fontSize: 14, fontWeight: 500 }}>{stats.top_property_title}</p>
            <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
              {stats.top_property_views} vistas · 30d
            </p>
          </div>
        )}
      </div>

      <div className="stats-row">
        {[
          { k: 'Vistas (7d)', v: stats.views_7d.toLocaleString('es-PY'), d: `${stats.views_30d.toLocaleString('es-PY')} en 30d`, up: true as boolean | null },
          { k: 'Leads totales', v: stats.leads_total.toLocaleString('es-PY'), d: 'consultas recibidas', up: true },
          { k: 'Conversión', v: `${stats.conversion_rate}%`, d: 'vistas → leads', up: stats.conversion_rate > 0 },
          { k: 'Propiedades activas', v: String(stats.active_properties), d: 'publicadas', up: null },
        ].map((s) => (
          <div key={s.k} className="stat-card">
            <div className="k">{s.k}</div>
            <div className="v">{s.v}</div>
            <div className={`delta ${s.up === true ? 'up' : s.up === false ? 'dn' : ''}`}>
              {s.up !== null && <span>{s.up ? '↗' : '↘'}</span>} {s.d}
            </div>
            {s.up !== null && <Sparkline up={s.up} />}
          </div>
        ))}
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <div>
            <h3>Tendencia de vistas</h3>
            <div className="meta">ÚLTIMOS 30 DÍAS</div>
          </div>
          <span className={`delta ${trendUp ? 'up' : 'dn'}`} style={{ fontSize: 12 }}>
            {trendUp ? '↗' : '↘'} vs. período anterior
          </span>
        </div>
        {currViews + prevViews === 0 ? (
          <p style={{ color: 'var(--gray)', fontSize: 14, padding: '24px 0' }}>
            Sin datos de vistas aún — se registran cuando visitan tus propiedades.
          </p>
        ) : trend.length > 1 ? (
          <AnalyticsTrendChart data={trend} />
        ) : (
          <ChartViewsLeads series={series} />
        )}
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h3>Rendimiento por propiedad</h3>
          <div className="meta">ORDENADO POR VISTAS 30D</div>
        </div>
        {properties.length === 0 ? (
          <p style={{ color: 'var(--gray)', fontSize: 14, padding: 24 }}>
            Aún no tenés propiedades con datos de analítica.
          </p>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>Propiedad</th>
                <th>Vistas 7d</th>
                <th>Vistas 30d</th>
                <th>Leads</th>
                <th>Conv.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((prop) => (
                <tr key={prop.property_id}>
                  <td className="row-title">{prop.title}</td>
                  <td>{prop.views_7d.toLocaleString('es-PY')}</td>
                  <td className="gold">{prop.views_30d.toLocaleString('es-PY')}</td>
                  <td>{prop.leads_total}</td>
                  <td>{prop.conversion_rate}%</td>
                  <td>
                    <Link
                      href={getPropertyPath({ id: prop.property_id, external_id: prop.property_id })}
                      style={{ color: 'var(--gold)', fontSize: 12 }}
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
