"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PROPERTIES } from '@/lib/v2-data';
import { getPropertyPath, mapPropertiesFromApi } from '@/lib/property-adapter';

interface ListingClientProps {
  properties?: any[];
  total?: number;
  searchParams?: any;
}

export function ListingClient({ properties: rawProperties = [], total, searchParams }: ListingClientProps) {
  const router = useRouter();
  // Use real data when available, fall back to mock
  const allProps = useMemo(() =>
    rawProperties.length > 0 ? mapPropertiesFromApi(rawProperties) : PROPERTIES,
    [rawProperties]
  );

  const [activeType, setActiveType] = React.useState(searchParams?.tipo || 'Todos');
  const [activeCity, setActiveCity] = React.useState(searchParams?.ciudad || 'Asunción');
  const [beds, setBeds] = React.useState(searchParams?.dormitorios || '3+');
  const [priceMin, setPriceMin] = React.useState(searchParams?.precio_min ? Number(searchParams.precio_min) : 150);
  const [priceMax, setPriceMax] = React.useState(searchParams?.precio_max ? Number(searchParams.precio_max) : 600);
  const [sortBy, setSortBy] = React.useState('relevant');
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [openDrop, setOpenDrop] = React.useState<string | null>(null);
  const [hoveredId, setHoveredId] = React.useState<string | number | null>(null);

  // Sync state changes back to URL
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (activeType && activeType !== 'Todos') params.set('tipo', activeType);
    if (activeCity && activeCity !== 'Asunción') params.set('ciudad', activeCity);
    if (beds && beds !== '3+') params.set('dormitorios', beds);
    if (priceMin && priceMin !== 150) params.set('precio_min', String(priceMin));
    if (priceMax && priceMax !== 600) params.set('precio_max', String(priceMax));
    
    const query = params.toString();
    router.push('/propiedades' + (query ? '?' + query : ''), { scroll: false });
  }, [activeType, activeCity, beds, priceMin, priceMax, router]);

  const types = ['Todos', 'Casa', 'Departamento', 'Loft', 'Terreno'];
  const cities = ['Asunción', 'Lambaré', 'San Lorenzo', 'CDE', 'Encarnación', 'Areguá'];
  const bedOpts = ['1+', '2+', '3+', '4+', '5+'];
  const features = ['Piscina', 'Garage', 'Jardín', 'Vista al río', 'Amoblado', 'Cocina equipada', 'Aire central'];
  const [activeFeatures, setActiveFeatures] = React.useState<Set<string>>(new Set());

  const toggleFeature = (f: string) => {
    const n = new Set(activeFeatures);
    n.has(f) ? n.delete(f) : n.add(f);
    setActiveFeatures(n);
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (e.target instanceof Element && !e.target.closest('.filter-bar')) setOpenDrop(null); };
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
              <span className="num">{total ?? allProps.length}</span> <span style={{ fontStyle: 'italic' }}>propiedades</span> encontradas
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
            {allProps.map(p => (
              <PropertyRow
                key={p.id}
                p={p}
                hovered={hoveredId === p.id}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => router.push(getPropertyPath(p))}
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
              <div className="map-title">{activeCity} · {total ?? allProps.length} resultados</div>
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
function PropertyRow({ p, hovered, onMouseEnter, onMouseLeave, onClick }: any) {
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
function FilterDropdown({ label, value, open, onToggle, children, width = 240 }: any) {
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
function SortDropdown({ value, onChange }: any) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const options = [
    { v: 'relevant', l: 'Más relevantes', s: 'Curado por nuestro equipo' },
    { v: 'price-asc', l: 'Precio: menor a mayor', s: 'USD ascendente' },
    { v: 'price-desc', l: 'Precio: mayor a menor', s: 'USD descendente' },
    { v: 'newest', l: 'Más recientes', s: 'Publicadas esta semana' },
    { v: 'm2', l: 'Mayor superficie', s: 'M² descendente' }
  ];
  const current = options.find(o => o.v === value) || options[0];

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false); };
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
export function MapMock({ hovered }: any) {
  const pins = [
    { id: 1, x: 60, y: 30 }, { id: 2, x: 75, y: 45 },
    { id: 3, x: 40, y: 55 }, { id: 4, x: 85, y: 25 },
    { id: 5, x: 55, y: 70 }, { id: 6, x: 30, y: 40 },
  ];
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    lines.push(<line key={"h" + i} x1="0" y1={i * 25} x2="540" y2={i * 25 + 4} stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />);
    lines.push(<line key={"v" + i} x1={i * 40} y1="0" y2="800" x2={i * 40 - 4} stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />);
  }
  return (
    <svg viewBox="0 0 540 720" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="540" height="720" fill="#0d0d0d" />
      <path d="M -20 200 C 100 220, 200 360, 340 380 S 540 540, 580 600" stroke="#1a2e4a" strokeWidth="50" fill="none" opacity="0.8" />
      <path d="M -20 200 C 100 220, 200 360, 340 380 S 540 540, 580 600" stroke="#243d5e" strokeWidth="30" fill="none" opacity="0.5" />
      {lines}
      <line x1="0" y1="280" x2="540" y2="320" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <line x1="220" y1="0" x2="240" y2="720" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <rect x="60" y="380" width="100" height="60" fill="rgba(184,146,42,0.04)" rx="4" />
      <rect x="380" y="200" width="80" height="40" fill="rgba(184,146,42,0.04)" rx="4" />
      <text x="20" y="40" fill="rgba(255,255,255,0.18)" fontSize="7" fontFamily="monospace" letterSpacing="0.08em">TRINIDAD</text>
      <text x="280" y="80" fill="rgba(255,255,255,0.18)" fontSize="7" fontFamily="monospace" letterSpacing="0.08em">VILLA MORRA</text>
      <text x="100" y="300" fill="rgba(255,255,255,0.18)" fontSize="7" fontFamily="monospace" letterSpacing="0.08em">SAN ROQUE</text>
      <text x="60" y="500" fill="rgba(255,255,255,0.18)" fontSize="7" fontFamily="monospace" letterSpacing="0.08em">LAMBARE</text>
      <text x="350" y="170" fill="#1a3a5c" fontSize="9" fontFamily="monospace">RIO PARAGUAY</text>
      {pins.map((pin) => {
        const active = hovered === pin.id;
        return (
          <g key={pin.id}>
            <circle cx={pin.x * 5.4} cy={pin.y * 7.2} r={active ? 10 : 6} fill="var(--gold)" opacity={active ? 1 : 0.8} style={{ transition: "r 0.3s" }} />
            <circle cx={pin.x * 5.4} cy={pin.y * 7.2} r={active ? 20 : 12} fill="var(--gold)" opacity={active ? 0.25 : 0.1} style={{ transition: "r 0.3s" }} />
          </g>
        );
      })}
    </svg>
  );
}
