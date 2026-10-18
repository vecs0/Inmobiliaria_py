import Link from 'next/link';
import type { DashboardLead } from '@/lib/seller/fetch-dashboard';

export type SeriesPoint = { date: string; views: number; leads: number };

export function getStatusPill(status: string) {
  const map: Record<string, { className: string; label: string }> = {
    active: { className: 'active', label: '● Activa' },
    pending: { className: 'draft', label: '○ Pendiente' },
    paused: { className: 'sold', label: '⏸ Pausada' },
    rejected: { className: 'sold', label: '× Rechazada' },
    expired: { className: 'sold', label: '✓ Expirada' },
    draft: { className: 'draft', label: '○ Borrador' },
    sold: { className: 'sold', label: '✓ Vendida' },
  };
  const m = map[status] || map.pending;
  return <span className={`status-pill ${m.className}`}>{m.label}</span>;
}

export function LeadRow({ l, last }: { l: DashboardLead; last: boolean }) {
  const scoreClass = l.score >= 75 ? 'hot' : l.score >= 50 ? 'warm' : 'cold';
  const msg = l.message || '';
  const initial = (l.name || '?').charAt(0).toUpperCase();
  return (
    <div
      className={`lead-row ${l.is_read ? '' : 'unread'}`}
      style={{ borderBottom: last ? 'none' : '1px solid var(--gray-line)' }}
    >
      <div className="lead-avatar" aria-hidden>
        {initial}
        {!l.is_read && <span className="lead-dot" />}
      </div>
      <div className="lead-content">
        <div className="lead-top">
          <span className="lead-name">
            {l.name}
            {!l.is_read && <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}> (sin leer)</span>}
          </span>
          <span className={`lead-score ${scoreClass}`}>
            <span className="lead-score-num">{l.score}</span>
            <span className="lead-score-label">score</span>
          </span>
        </div>
        <div className="lead-prop">
          {l.property_id ? (
            <Link href={`/propiedades/${l.property_id}`} style={{ color: 'var(--gold)' }}>
              {l.property_title || l.property_id.slice(0, 8)}
            </Link>
          ) : (
            'Consulta general'
          )}{' '}
          · {msg.slice(0, 80)}
          {msg.length > 80 ? '…' : ''}
        </div>
        <div className="lead-foot">
          <span className="lead-source">{l.source.toUpperCase()}</span>
          {(l.email || l.phone) && (
            <span className="lead-source" style={{ textTransform: 'none' }}>
              {l.email && <a href={`mailto:${l.email}`} style={{ color: 'inherit' }}>{l.email}</a>}
              {l.email && l.phone && ' · '}
              {l.phone && <a href={`tel:${l.phone}`} style={{ color: 'inherit' }}>{l.phone}</a>}
            </span>
          )}
          <span className="lead-time">{l.created_at}</span>
        </div>
      </div>
    </div>
  );
}

/** Mini-gráfico. Con `data` dibuja la serie real; sin datos, una línea plana. */
export function Sparkline({ up = true, data }: { up?: boolean; data?: number[] }) {
  const values = data && data.length > 1 ? data : [0, 0];
  const max = Math.max(1, ...values);
  const step = 80 / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(20 - (v / max) * 18).toFixed(1)}`).join(' ');
  return (
    <svg className="spark" width="80" height="22" viewBox="0 0 80 22" aria-hidden>
      <polyline points={points} fill="none" stroke={up ? 'var(--gold)' : '#ef4444'} strokeWidth="1.2" />
    </svg>
  );
}

/** Gráfico de vistas y consultas a partir de una serie diaria real. */
export function ChartViewsLeads({ series = [] }: { series?: SeriesPoint[] } = {}) {
  const w = 660;
  const h = 220;
  const pts = series.length > 1 ? series : [{ date: '', views: 0, leads: 0 }, { date: '', views: 0, leads: 0 }];
  const views = pts.map((p) => p.views);
  const leads = pts.map((p) => p.leads);
  const maxV = Math.max(1, ...views) * 1.1;
  const maxL = Math.max(1, ...leads) * 1.1;
  const stepX = w / (pts.length - 1);
  const linePath = (arr: number[], max: number) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${h - (v / max) * h}`).join(' ');
  const totalViews = views.reduce((a, b) => a + b, 0);
  const totalLeads = leads.reduce((a, b) => a + b, 0);

  const labelIdx = [0, Math.round((pts.length - 1) / 3), Math.round(((pts.length - 1) * 2) / 3), pts.length - 1];
  const fmt = (d: string) => {
    if (!d) return '';
    const [, m, day] = d.slice(0, 10).split('-');
    return `${day}/${m}`;
  };

  return (
    <svg
      className="chart-svg"
      viewBox={`0 0 ${w} ${h + 30}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Últimos ${series.length} días: ${totalViews} vistas y ${totalLeads} consultas`}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
        <line key={i} x1="0" y1={h * g} x2={w} y2={h * g} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7BA88F" />
          <stop offset="100%" stopColor="#7BA88F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${linePath(views, maxV)} L ${w} ${h} L 0 ${h} Z`} fill="url(#goldGrad)" opacity="0.18" />
      <path d={linePath(views, maxV)} fill="none" stroke="#7BA88F" strokeWidth="1.6" />
      <path d={linePath(leads, maxL)} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeDasharray="4 4" />
      <circle cx={(views.length - 1) * stepX} cy={h - (views[views.length - 1] / maxV) * h} r="4" fill="#7BA88F" />
      <circle cx={(leads.length - 1) * stepX} cy={h - (leads[leads.length - 1] / maxL) * h} r="3" fill="white" />
      {series.length > 1 &&
        labelIdx.map((idx, i) => (
          <text
            key={i}
            x={idx * stepX}
            y={h + 22}
            fill="#666"
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor={i === 0 ? 'start' : i === labelIdx.length - 1 ? 'end' : 'middle'}
          >
            {i === labelIdx.length - 1 ? 'Hoy' : fmt(pts[idx].date)}
          </text>
        ))}
      {totalViews === 0 && totalLeads === 0 && (
        <text x={w / 2} y={h / 2} fill="#666" fontSize="12" fontFamily="JetBrains Mono" textAnchor="middle">
          Sin actividad en el período
        </text>
      )}
    </svg>
  );
}
