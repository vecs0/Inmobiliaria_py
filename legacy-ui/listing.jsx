/* ====================================================
   InmobiliariaPY — Property Listing Page
   ==================================================== */

function Listing({ setPage, openDetail }) {
  const [activeType, setActiveType] = React.useState('Casa');
  const [activeCity, setActiveCity] = React.useState('Asunción');
  const [beds, setBeds] = React.useState('3+');
  const [priceMin, setPriceMin] = React.useState(150);
  const [priceMax, setPriceMax] = React.useState(600);
  const [sortBy, setSortBy] = React.useState('relevant');
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [openDrop, setOpenDrop] = React.useState(null);
  const [hoveredId, setHoveredId] = React.useState(null);

  const types = ['Todos', 'Casa', 'Departamento', 'Loft', 'Terreno'];
  const cities = ['Asunción', 'Lambaré', 'San Lorenzo', 'CDE', 'Encarnación', 'Areguá'];
  const bedOpts = ['1+', '2+', '3+', '4+', '5+'];
  const features = ['Piscina', 'Garage', 'Jardín', 'Vista al río', 'Amoblado', 'Cocina equipada', 'Aire central'];
  const [activeFeatures, setActiveFeatures] = React.useState(new Set());

  const toggleFeature = (f) => {
    const n = new Set(activeFeatures);
    n.has(f) ? n.delete(f) : n.add(f);
    setActiveFeatures(n);
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const onDoc = (e) => { if (!e.target.closest('.filter-bar')) setOpenDrop(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div style={{ background: '#111111', minHeight: '100vh', paddingTop: 80 }}>
      {/* Compact horizontal filter bar */}
      <div className="filter-bar">
        <div className="filter-bar-inner">
          {/* Tipo */}
          <FilterDropdown
            label="Tipo"
            value={activeType}
            open={openDrop === 'type'}
            onToggle={() => setOpenDrop(openDrop === 'type' ? null : 'type')}
          >
            <div className="dd-chips">
              {types.map(t => (
                <button
                  key={t}
                  className={`dd-chip ${activeType === t ? 'active' : ''}`}
                  onClick={() => { setActiveType(t); setOpenDrop(null); }}
                >{t}</button>
              ))}
            </div>
          </FilterDropdown>

          {/* Ciudad */}
          <FilterDropdown
            label="Ciudad"
            value={activeCity}
            open={openDrop === 'city'}
            onToggle={() => setOpenDrop(openDrop === 'city' ? null : 'city')}
          >
            <div className="dd-chips">
              {cities.map(c => (
                <button
                  key={c}
                  className={`dd-chip ${activeCity === c ? 'active' : ''}`}
                  onClick={() => { setActiveCity(c); setOpenDrop(null); }}
                >{c}</button>
              ))}
            </div>
          </FilterDropdown>

          {/* Precio */}
          <FilterDropdown
            label="Precio"
            value={`USD ${priceMin}k – ${priceMax}k`}
            open={openDrop === 'price'}
            onToggle={() => setOpenDrop(openDrop === 'price' ? null : 'price')}
            width={320}
          >
            <div className="dd-range">
              <div className="dd-range-vals">
                <span>USD {priceMin}k</span>
                <span>USD {priceMax}k</span>
              </div>
              <input type="range" className="slider" min="50" max="1500" value={priceMin} onChange={e => setPriceMin(Math.min(+e.target.value, priceMax - 50))} />
              <input type="range" className="slider" min="50" max="1500" value={priceMax} onChange={e => setPriceMax(Math.max(+e.target.value, priceMin + 50))} />
              <div className="dd-range-scale"><span>50k</span><span>1.5M</span></div>
            </div>
          </FilterDropdown>

          {/* Dormitorios */}
          <FilterDropdown
            label="Dormitorios"
            value={beds}
            open={openDrop === 'beds'}
            onToggle={() => setOpenDrop(openDrop === 'beds' ? null : 'beds')}
          >
            <div className="dd-chips">
              {bedOpts.map(b => (
                <button
                  key={b}
                  className={`dd-chip ${beds === b ? 'active' : ''}`}
                  onClick={() => { setBeds(b); setOpenDrop(null); }}
                >{b}</button>
              ))}
            </div>
          </FilterDropdown>

          {/* More */}
          <button className={`fb-more ${moreOpen ? 'open' : ''}`} onClick={() => setMoreOpen(!moreOpen)} data-cursor="hover">
            <span>Más filtros</span>
            <span className="fb-count">{activeFeatures.size > 0 ? activeFeatures.size : ''}</span>
            <span className="fb-chev">{moreOpen ? '−' : '+'}</span>
          </button>

          <div className="fb-spacer" />

          <SortDropdown value={sortBy} onChange={setSortBy} />

          <a className="fb-save">★ Guardar búsqueda</a>
        </div>

        {moreOpen && (
          <div className="filter-bar-more">
            <div className="fb-more-label">Características</div>
            <div className="dd-chips">
              {features.map(f => (
                <button
                  key={f}
                  className={`dd-chip ${activeFeatures.has(f) ? 'active' : ''}`}
                  onClick={() => toggleFeature(f)}
                >{f}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT — always split with map */}
      <main className="listing-split">
        <section className="listing-results">
          <div className="listing-topbar">
            <div className="listing-count">
              <span className="num">247</span> <span style={{ fontStyle: 'italic' }}>propiedades</span> encontradas
              <span className="topbar-meta">en {activeCity} · actualizado hoy</span>
            </div>
            <div className="listing-tools">
              <div className="ai-search">
                <span className="ai-tag">AI</span>
                <input placeholder='Probá: "Casa con piscina cerca del río"' />
                <span className="ai-key">↵</span>
              </div>
            </div>
          </div>

          <div className="active-filters">
            {activeType !== 'Todos' && <span className="active-pill">{activeType} <span className="x" onClick={() => setActiveType('Todos')}>×</span></span>}
            <span className="active-pill">{activeCity} <span className="x">×</span></span>
            <span className="active-pill">USD {priceMin}k – {priceMax}k <span className="x">×</span></span>
            <span className="active-pill">{beds} dorm <span className="x">×</span></span>
            {[...activeFeatures].map(f => (
              <span key={f} className="active-pill">{f} <span className="x" onClick={() => toggleFeature(f)}>×</span></span>
            ))}
            {(activeFeatures.size > 0 || activeType !== 'Todos') && (
              <button className="clear-all" onClick={() => { setActiveFeatures(new Set()); setActiveType('Todos'); }}>Limpiar todo</button>
            )}
          </div>

          <div className="prop-list">
            {PROPERTIES.map(p => (
              <PropertyRow
                key={p.id}
                p={p}
                hovered={hoveredId === p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => openDetail(p)}
              />
            ))}
          </div>

          <div className="pagination">
            <button className="chip" style={{ background: 'var(--bg-mid)', color: 'var(--white)', borderColor: 'var(--gray-line)' }}>← Anterior</button>
            <span>página 01 / 21</span>
            <button className="chip" style={{ background: 'var(--gold)', color: '#0e0e0e', borderColor: 'var(--gold)' }}>Siguiente →</button>
          </div>
        </section>

        <aside className="listing-map">
          <div className="map-head-inline">
            <div>
              <div className="map-eyebrow">VISTA EN MAPA</div>
              <div className="map-title">{activeCity} · {PROPERTIES.length} resultados</div>
            </div>
            <div className="map-legend">
              <span className="dot" />
              <span>Propiedades en zona</span>
            </div>
          </div>
          <div className="map-canvas-inline">
            <MapMock hovered={hoveredId} />
            <div className="map-attrib">CartoDB · OpenStreetMap</div>
          </div>
        </aside>
      </main>
    </div>
  );
}

// ---------- Property row (horizontal list card) ----------
function PropertyRow({ p, hovered, onMouseEnter, onMouseLeave, onClick }) {
  return (
    <article
      className={`prop-row ${hovered ? 'hovered' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      data-cursor="crosshair"
    >
      <div className="row-img">
        <img src={p.img} alt={p.title} />
        <div className="row-tag">{p.type}</div>
      </div>
      <div className="row-body">
        <div className="row-top">
          <div className="row-meta">
            <span className="row-id">{p.id}</span>
            <span className="row-loc-pill">
              <span className="loc-dot" />
              {p.loc}
            </span>
          </div>
          <div className="row-price">{p.price}</div>
        </div>
        <h3 className="row-title">{p.title}</h3>
        <p className="row-desc">
          {p.type} de {p.m2} m² en {p.loc.split(',')[0]}. {p.beds} dormitorios · {p.baths} baños · cocheras + jardín.
        </p>
        <div className="row-bottom">
          <div className="row-specs">
            <span><strong>{p.beds}</strong> dorm</span>
            <span className="dot-sep">·</span>
            <span><strong>{p.baths}</strong> baños</span>
            <span className="dot-sep">·</span>
            <span><strong>{p.m2}</strong> m²</span>
            <span className="dot-sep">·</span>
            <span className="row-permm">USD {Math.round(p.priceN / p.m2).toLocaleString('es-PY')}/m²</span>
          </div>
          <div className="row-cta">
            Ver propiedad <span className="row-arrow">→</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// Reusable filter dropdown
function FilterDropdown({ label, value, open, onToggle, children, width = 240 }) {
  return (
    <div className={`fb-drop ${open ? 'open' : ''}`}>
      <button className="fb-drop-trigger" onClick={onToggle} data-cursor="hover">
        <span className="fb-drop-label">{label}</span>
        <span className="fb-drop-value">{value}</span>
        <span className="fb-drop-chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="fb-drop-panel" style={{ minWidth: width }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Custom modern sort dropdown
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const options = [
    { v: 'relevant', l: 'Más relevantes', s: 'Curado por nuestro equipo' },
    { v: 'price-asc', l: 'Precio: menor a mayor', s: 'USD ascendente' },
    { v: 'price-desc', l: 'Precio: mayor a menor', s: 'USD descendente' },
    { v: 'newest', l: 'Más recientes', s: 'Publicadas esta semana' },
    { v: 'm2', l: 'Mayor superficie', s: 'M² descendente' }
  ];
  const current = options.find(o => o.v === value) || options[0];

  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={`sort-dd ${open ? 'open' : ''}`} ref={ref}>
      <button className="sort-trigger" onClick={() => setOpen(!open)} data-cursor="hover">
        <span className="sort-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 4h8M3 7h6M3 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        <span className="sort-label-stack">
          <span className="sort-key">ORDENAR</span>
          <span className="sort-val">{current.l}</span>
        </span>
        <span className="sort-chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="sort-panel">
          {options.map(o => (
            <button
              key={o.v}
              className={`sort-opt ${value === o.v ? 'active' : ''}`}
              onClick={() => { onChange(o.v); setOpen(false); }}
            >
              <span className="sort-opt-main">
                <span className="sort-opt-label">{o.l}</span>
                <span className="sort-opt-sub">{o.s}</span>
              </span>
              {value === o.v && <span className="sort-opt-mark">●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SplitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="2" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8" y="2" width="4.5" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8" y="8" width="4.5" height="4" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="2" width="11" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="6" width="11" height="3" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1.5" y="10" width="11" height="2" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

// Stylized fake map (CartoDB-dark-matter feel) using SVG
function MapMock({ hovered }) {
  // Simple street grid + gold pins
  const pins = [
    { id: 'PY-0241', x: 28, y: 22, price: '485k' },
    { id: 'PY-0188', x: 56, y: 38, price: '312k' },
    { id: 'PY-0317', x: 42, y: 58, price: '268k' },
    { id: 'PY-0402', x: 68, y: 70, price: '198k' },
    { id: 'PY-0099', x: 24, y: 76, price: '425k' },
    { id: 'PY-0512', x: 78, y: 28, price: '142k' },
    { id: 'PY-0227', x: 52, y: 14, price: '520k' }
  ];
  // Build a grid of streets
  const lines = [];
  for (let i = 0; i < 14; i++) {
    lines.push(<line key={'h' + i} x1="0" y1={i * 25} x2="540" y2={i * 25 + 4} stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />);
    lines.push(<line key={'v' + i} x1={i * 40} y1="0" y2="800" x2={i * 40 - 4} stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />);
  }
  return (
    <svg viewBox="0 0 540 720" style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* river */}
      <path d="M -20 200 C 100 220, 200 360, 340 380 S 540 540, 580 600" stroke="#1a2e4a" strokeWidth="50" fill="none" opacity="0.8" />
      <path d="M -20 200 C 100 220, 200 360, 340 380 S 540 540, 580 600" stroke="#243d5e" strokeWidth="50" fill="none" opacity="0.5" />
      {lines}
      {/* boulevards */}
      <line x1="0" y1="280" x2="540" y2="320" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <line x1="220" y1="0" x2="240" y2="720" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      {/* parks */}
      <rect x="60" y="380" width="100" height="60" fill="rgba(123,168,143,0.06)" rx="4" />
      <rect x="380" y="200" width="80" height="40" fill="rgba(123,168,143,0.06)" rx="4" />
      {/* labels */}
      <text x="20" y="40" fill="#666" fontSize="9" fontFamily="JetBrains Mono">VILLA MORRA</text>
      <text x="260" y="60" fill="#666" fontSize="9" fontFamily="JetBrains Mono">CARMELITAS</text>
      <text x="380" y="500" fill="#666" fontSize="9" fontFamily="JetBrains Mono">RECOLETA</text>
      <text x="80" y="600" fill="#666" fontSize="9" fontFamily="JetBrains Mono">CENTRO</text>
      <text x="380" y="160" fill="#3a5a87" fontSize="10" fontFamily="JetBrains Mono">RÍO PARAGUAY</text>
      {/* pins */}
      {pins.map((p, i) => {
        const isHover = hovered === p.id;
        return (
          <g key={i} transform={`translate(${p.x * 5.4}, ${p.y * 7.2})`} style={{ transition: 'transform 0.3s' }}>
            <circle r={isHover ? 30 : 22} fill="rgba(123,168,143,0.15)" style={{ transition: 'r 0.3s' }} />
            <circle r={isHover ? 18 : 14} fill={isHover ? '#a3d4be' : '#7BA88F'} stroke="#0e0e0e" strokeWidth="2" style={{ transition: 'all 0.3s' }} />
            <text textAnchor="middle" dy="4" fill="#0e0e0e" fontSize={isHover ? 11 : 10} fontFamily="JetBrains Mono" fontWeight="600">{p.price}</text>
          </g>
        );
      })}
    </svg>
  );
}

window.Listing = Listing;
