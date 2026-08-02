/* ====================================================
   InmobiliariaPY — Seller Dashboard
   Aligned with backend: stats (active_properties / leads_total
   / views_7d / conversion_rate), lead scoring, Boost plans,
   Listing statuses (pending / active / paused / rejected / expired)
   ==================================================== */

const BOOST_PLANS = [
  { key: '7d', label: '1 Semana', days: 7, priceUsd: 9.99, recommended: false, features: ['Posición destacada por 7 días', 'Badge "Destacado PRO"', 'Prioridad en búsqueda'] },
  { key: '15d', label: '2 Semanas', days: 15, priceUsd: 17.99, recommended: true, features: ['Posición destacada por 15 días', 'Badge "Destacado PRO"', 'Prioridad en búsqueda', 'Sección destacados del inicio'] },
  { key: '30d', label: '1 Mes', days: 30, priceUsd: 29.99, recommended: false, features: ['Posición destacada por 30 días', 'Máxima prioridad', 'Newsletter semanal'] }
];

function getStatusPill(status) {
  const map = {
    active: { className: 'active', label: '● Activa' },
    pending: { className: 'draft', label: '○ Pendiente' },
    paused: { className: 'sold', label: '⏸ Pausada' },
    rejected: { className: 'sold', label: '× Rechazada' },
    expired: { className: 'sold', label: '✓ Expirada' },
    draft: { className: 'draft', label: '○ Borrador' },
    sold: { className: 'sold', label: '✓ Vendida' }
  };
  const m = map[status] || map.draft;
  return <span className={`status-pill ${m.className}`}>{m.label}</span>;
}

function Dashboard({ user }) {
  const [section, setSection] = React.useState('overview');

  // Real backend KPI shape (DarkDashboardClient props.stats)
  const stats = {
    active_properties: 5,
    leads_total: 142,
    views_7d: 12487,
    conversion_rate: 8.4
  };

  // Recent leads with Fase 4 scoring
  const recentLeads = [
    { id: '1', name: 'Carolina Velázquez', email: 'carolina.v@gmail.com', phone: '+595 981 555 444', message: 'Me interesa esta propiedad, ¿puedo agendar una visita el sábado?', property_id: 'PY-0241', status: 'pending', score: 85, score_details: ['Mensaje extenso', 'Teléfono verificado', 'Visita solicitada'], is_read: false, created_at: 'hace 12 min', source: 'WhatsApp' },
    { id: '2', name: 'Joaquín Romero', email: 'joaquin@empresa.com.py', phone: '+595 982 333 111', message: 'Consulta sobre financiación', property_id: 'PY-0188', status: 'pending', score: 67, score_details: ['Email corporativo', 'Pregunta específica'], is_read: false, created_at: 'hace 47 min', source: 'Formulario' },
    { id: '3', name: 'Familia López', email: 'lopez.family@gmail.com', phone: '+595 985 222 999', message: 'Llamada perdida', property_id: 'PY-0402', status: 'contacted', score: 52, score_details: ['Llamada inbound'], is_read: true, created_at: 'hace 2 h', source: 'Llamada' },
    { id: '4', name: 'Diego Martínez', email: 'diego.m@hotmail.com', phone: '+595 983 444 888', message: 'Quiero saber más', property_id: 'PY-0317', status: 'pending', score: 34, score_details: ['Mensaje corto'], is_read: false, created_at: 'hace 4 h', source: 'WhatsApp' }
  ];

  return (
    <div className="dash-shell" style={{ paddingTop: 0 }}>
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <span>Inmobiliaria</span><span style={{ color: 'var(--gold)' }}>PY</span><span className="dot" />
        </div>

        <div className="dash-nav-section">Panel</div>
        <div className="dash-nav">
          {[
            { id: 'overview', icon: '◇', label: 'Resumen' },
            { id: 'props', icon: '▤', label: 'Mis propiedades' },
            { id: 'leads', icon: '↘', label: 'Consultas', badge: 2 },
            { id: 'boost', icon: '★', label: 'Destacar' },
            { id: 'imports', icon: '⇋', label: 'Importar XML' },
            { id: 'analytics', icon: '▲', label: 'Analytics' }
          ].map(n => (
            <button key={n.id} className={`dash-nav-item ${section === n.id ? 'active' : ''}`} onClick={() => setSection(n.id)}>
              <span className="icon" style={{ color: section === n.id ? 'var(--gold)' : undefined }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && <span className="nav-badge">{n.badge}</span>}
            </button>
          ))}
        </div>

        <div className="dash-nav-section">Empresa</div>
        <div className="dash-nav">
          <a className="dash-nav-item"><span className="icon">⚐</span><span style={{ flex: 1 }}>Plan & Stripe</span></a>
          <a className="dash-nav-item"><span className="icon">⚙</span><span style={{ flex: 1 }}>API Keys</span></a>
          <a className="dash-nav-item"><span className="icon">◯</span><span style={{ flex: 1 }}>Perfil</span></a>
        </div>

        <div style={{ position: 'absolute', bottom: 28, left: 22, right: 22 }}>
          <div style={{ background: 'var(--bg-mid)', border: '1px solid rgba(123,168,143,0.3)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase' }}>EMPRESA · PRO</div>
              <a style={{ fontSize: 10, color: 'var(--gray)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cambiar</a>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.5, marginBottom: 12 }}>{stats.active_properties} de 50 propiedades activas</div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(stats.active_properties / 50) * 100}%`, background: 'var(--gold)' }} />
            </div>
          </div>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>BUEN DÍA, {(user?.name || 'ANDRÉS').toUpperCase().split(' ')[0]}</div>
            <h1>Resumen de la <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>semana.</span></h1>
          </div>
          <div className="user-pill">
            <span>{user?.name || 'Andrés Martínez'}</span>
            <span className="avatar" />
          </div>
        </div>

        {/* Stats row — backend shape */}
        <div className="stats-row">
          {[
            { k: 'Vistas (7d)', v: stats.views_7d.toLocaleString('es-PY'), d: '+18.4%', up: true },
            { k: 'Consultas totales', v: stats.leads_total.toLocaleString('es-PY'), d: '+24.1%', up: true },
            { k: 'Propiedades activas', v: stats.active_properties.toString(), d: 'de 50 max', up: null },
            { k: 'Conversión', v: `${stats.conversion_rate}%`, d: '+1.2pp', up: true }
          ].map(s => (
            <div key={s.k} className="stat-card">
              <div className="k">{s.k}</div>
              <div className="v">{s.v}</div>
              <div className={`delta ${s.up === true ? 'up' : s.up === false ? 'dn' : ''}`}>
                {s.up !== null && <span>{s.up ? '↗' : '↘'}</span>} {s.d}
              </div>
              <Sparkline up={true} />
            </div>
          ))}
        </div>

        {/* Chart + leads with scoring */}
        <div className="dash-row">
          <div className="dash-panel">
            <div className="dash-panel-head">
              <h3>Vistas & consultas</h3>
              <div className="meta">ÚLTIMOS 30 DÍAS</div>
            </div>
            <ChartViewsLeads />
            <div className="legend">
              <span><span className="swatch" /> Vistas</span>
              <span><span className="swatch b" /> Consultas</span>
            </div>
          </div>

          <div className="dash-panel">
            <div className="dash-panel-head">
              <h3>Consultas calientes</h3>
              <a className="meta" style={{ color: 'var(--gold)' }}>VER TODAS →</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentLeads.map((l, i) => (
                <LeadRow key={l.id} l={l} last={i === recentLeads.length - 1} />
              ))}
            </div>
          </div>
        </div>

        {/* Boost plans (Stripe) */}
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <h3>Destacar propiedades</h3>
              <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4 }}>Aumentá la visibilidad de tus mejores propiedades.</div>
            </div>
            <div className="meta">STRIPE · PAGOS SEGUROS</div>
          </div>
          <div className="boost-grid">
            {BOOST_PLANS.map(plan => (
              <div key={plan.key} className={`boost-plan ${plan.recommended ? 'recommended' : ''}`}>
                {plan.recommended && <div className="boost-rec">★ Recomendado</div>}
                <div className="boost-plan-label">{plan.label}</div>
                <div className="boost-plan-price">
                  <span className="amount">USD {plan.priceUsd}</span>
                  <span className="per">/{plan.days}d</span>
                </div>
                <ul className="boost-features">
                  {plan.features.map((f, i) => (
                    <li key={i}><span className="check">✓</span>{f}</li>
                  ))}
                </ul>
                <button className={`boost-cta ${plan.recommended ? 'primary' : ''}`}>
                  Activar destacado <span style={{ marginLeft: 6 }}>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Properties table — real status enums */}
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Mis propiedades</h3>
            <button className="btn btn-gold" style={{ padding: '10px 18px', fontSize: 11 }}>+ Publicar nueva</button>
          </div>
          <table className="list-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Propiedad</th>
                <th>Ubicación</th>
                <th>Op.</th>
                <th>Precio</th>
                <th>Vistas</th>
                <th>Leads</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {[
                { ...PROPERTIES[0], views: 2840, leads: 47, status: 'active' },
                { ...PROPERTIES[1], views: 1923, leads: 31, status: 'active' },
                { ...PROPERTIES[2], views: 1402, leads: 18, status: 'active' },
                { ...PROPERTIES[3], views: 0, leads: 0, status: 'pending' },
                { ...PROPERTIES[4], views: 5210, leads: 89, status: 'paused' }
              ].map(p => (
                <tr key={p.id}>
                  <td className="gold">{p.id}</td>
                  <td className="row-title">{p.title}</td>
                  <td style={{ color: 'var(--gray)' }}>{p.loc}</td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em',
                      textTransform: 'uppercase', color: p.operation_type === 'venta' ? 'var(--gold)' : '#7BA88F',
                      padding: '3px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 4
                    }}>{p.operation_type}</span>
                  </td>
                  <td className="gold">{p.priceFormatted}</td>
                  <td>{p.views.toLocaleString('es-PY')}</td>
                  <td>{p.leads}</td>
                  <td>{getStatusPill(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// Lead row with scoring (Fase 4)
function LeadRow({ l, last }) {
  const scoreClass = l.score >= 75 ? 'hot' : l.score >= 50 ? 'warm' : 'cold';
  return (
    <div className={`lead-row ${l.is_read ? '' : 'unread'}`} style={{ borderBottom: last ? 'none' : '1px solid var(--gray-line)' }}>
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
        <div className="lead-prop">{l.property_id} · {l.message.slice(0, 50)}{l.message.length > 50 ? '…' : ''}</div>
        <div className="lead-foot">
          <span className="lead-source">{l.source.toUpperCase()}</span>
          <span className="lead-time">{l.created_at}</span>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ up = true }) {
  const points = up
    ? '0,18 10,16 20,17 30,12 40,13 50,8 60,9 70,4 80,5'
    : '0,4 10,6 20,5 30,9 40,8 50,12 60,11 70,15 80,16';
  return (
    <svg className="spark" width="80" height="22" viewBox="0 0 80 22">
      <polyline points={points} fill="none" stroke={up ? 'var(--gold)' : '#ef4444'} strokeWidth="1.2" />
    </svg>
  );
}

function ChartViewsLeads() {
  const w = 660, h = 220;
  const views = [40, 65, 50, 78, 95, 110, 90, 130, 145, 120, 160, 175, 150, 190, 210, 195, 220, 245, 230, 260, 280, 255, 290, 310, 295, 330, 320, 360, 380, 410];
  const leads = [4, 6, 5, 7, 9, 11, 9, 12, 14, 12, 16, 17, 15, 19, 20, 18, 21, 23, 22, 25, 27, 24, 28, 30, 28, 32, 30, 34, 36, 38];
  const maxV = 420, maxL = 40;
  const stepX = w / (views.length - 1);
  const linePath = (arr, max) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${h - (v / max) * h}`).join(' ');

  return (
    <svg className="chart-svg" viewBox={`0 0 ${w} ${h + 30}`} preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
        <line key={i} x1="0" y1={h * g} x2={w} y2={h * g} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <path d={linePath(views, maxV) + ` L ${w} ${h} L 0 ${h} Z`} fill="url(#goldGrad)" opacity="0.18" />
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
        <text key={i} x={(i / 4) * w} y={h + 22} fill="#666" fontSize="10" fontFamily="JetBrains Mono" textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>{l}</text>
      ))}
    </svg>
  );
}

window.Dashboard = Dashboard;
