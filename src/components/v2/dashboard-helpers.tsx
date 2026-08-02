import type { DashboardLead } from '@/lib/seller/fetch-dashboard';

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
  return (
    <div
      className={`lead-row ${l.is_read ? '' : 'unread'}`}
      style={{ borderBottom: last ? 'none' : '1px solid var(--gray-line)' }}
    >
      <div className="lead-avatar">
        {l.name[0]}
        {!l.is_read && <span className="lead-dot" />}
      </div>
      <div className="lead-content">
        <div className="lead-top">
          <span className="lead-name">{l.name}</span>
          <span className={`lead-score ${scoreClass}`}>
            <span className="lead-score-num">{l.score}</span>
            <span className="lead-score-label">score</span>
          </span>
        </div>
        <div className="lead-prop">
          {l.property_id} · {msg.slice(0, 50)}
          {msg.length > 50 ? '…' : ''}
        </div>
        <div className="lead-foot">
          <span className="lead-source">{l.source.toUpperCase()}</span>
          <span className="lead-time">{l.created_at}</span>
        </div>
      </div>
    </div>
  );
}

export function Sparkline({ up = true }: { up?: boolean }) {
  const points = up
    ? '0,18 10,16 20,17 30,12 40,13 50,8 60,9 70,4 80,5'
    : '0,4 10,6 20,5 30,9 40,8 50,12 60,11 70,15 80,16';
  return (
    <svg className="spark" width="80" height="22" viewBox="0 0 80 22">
      <polyline points={points} fill="none" stroke={up ? 'var(--gold)' : '#ef4444'} strokeWidth="1.2" />
    </svg>
  );
}

export function ChartViewsLeads() {
  const w = 660;
  const h = 220;
  const views = [40, 65, 50, 78, 95, 110, 90, 130, 145, 120, 160, 175, 150, 190, 210, 195, 220, 245, 230, 260, 280, 255, 290, 310, 295, 330, 320, 360, 380, 410];
  const leads = [4, 6, 5, 7, 9, 11, 9, 12, 14, 12, 16, 17, 15, 19, 20, 18, 21, 23, 22, 25, 27, 24, 28, 30, 28, 32, 30, 34, 36, 38];
  const maxV = 420;
  const maxL = 40;
  const stepX = w / (views.length - 1);
  const linePath = (arr: number[], max: number) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${h - (v / max) * h}`).join(' ');

  return (
    <svg className="chart-svg" viewBox={`0 0 ${w} ${h + 30}`} preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
        <line key={i} x1="0" y1={h * g} x2={w} y2={h * g} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d={`${linePath(views, maxV)} L ${w} ${h} L 0 ${h} Z`} fill="url(#goldGrad)" opacity="0.18" />
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7BA88F" />
          <stop offset="100%" stopColor="#7BA88F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={linePath(views, maxV)} fill="none" stroke="#7BA88F" strokeWidth="1.6" />
      <path d={linePath(leads, maxL)} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeDasharray="4 4" />
      <circle cx={(views.length - 1) * stepX} cy={h - (views[views.length - 1] / maxV) * h} r="4" fill="#7BA88F" />
      <circle cx={(leads.length - 1) * stepX} cy={h - (leads[leads.length - 1] / maxL) * h} r="3" fill="white" />
      {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Hoy'].map((l, i) => (
        <text
          key={l}
          x={(i / 4) * w}
          y={h + 22}
          fill="#666"
          fontSize="10"
          fontFamily="JetBrains Mono"
          textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}
        >
          {l}
        </text>
      ))}
    </svg>
  );
}
