"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPropertyPath, getPropertyRef, mapPropertiesFromApi, type V2Property } from '@/lib/property-adapter';
import { AMENITIES_FILTER, PROPERTY_TYPES } from '@/lib/v2-data';
import { PropertiesMapDynamic, type MapItem } from '@/components/map';
import { FavoriteButton } from '@/components/v2/PropertyCard';
import { createSavedSearch } from '@/lib/supabase/saved-searches-actions';

export interface ListingSearchParams {
  ciudad?: string;
  q?: string;
  tipo?: string;
  operacion?: string;
  precio_min?: string;
  precio_max?: string;
  dormitorios?: string;
  destacado?: string;
  orden?: string;
  page?: string;
  amenities?: string;
}

interface ListingClientProps {
  properties?: Record<string, unknown>[];
  total?: number;
  page?: number;
  totalPages?: number;
  cities?: string[];
  searchParams?: ListingSearchParams;
}

type Filters = {
  ciudad: string;
  q: string;
  tipo: string;
  operacion: string;
  precio_min: string;
  precio_max: string;
  dormitorios: string;
  destacado: string;
  orden: string;
  amenities: string[];
};

function filtersFromParams(sp: ListingSearchParams = {}): Filters {
  return {
    ciudad: sp.ciudad ?? '',
    q: sp.q ?? '',
    tipo: sp.tipo ?? '',
    operacion: sp.operacion ?? '',
    precio_min: sp.precio_min ?? '',
    precio_max: sp.precio_max ?? '',
    dormitorios: (sp.dormitorios ?? '').replace('+', ''),
    destacado: sp.destacado === 'true' ? 'true' : '',
    orden: sp.orden ?? '',
    amenities: sp.amenities ? sp.amenities.split(',').filter(Boolean) : [],
  };
}

function filtersToQuery(f: Filters, page?: number): string {
  const p = new URLSearchParams();
  if (f.ciudad) p.set('ciudad', f.ciudad);
  if (f.q) p.set('q', f.q);
  if (f.tipo) p.set('tipo', f.tipo);
  if (f.operacion) p.set('operacion', f.operacion);
  if (f.precio_min) p.set('precio_min', f.precio_min);
  if (f.precio_max) p.set('precio_max', f.precio_max);
  if (f.dormitorios) p.set('dormitorios', f.dormitorios);
  if (f.destacado) p.set('destacado', 'true');
  if (f.amenities.length) p.set('amenities', f.amenities.join(','));
  if (f.orden) p.set('orden', f.orden);
  if (page && page > 1) p.set('page', String(page));
  return p.toString();
}

const EMPTY: Filters = filtersFromParams({});
const fmtUsd = (v: string) => `USD ${Number(v).toLocaleString('es-PY')}`;

export function ListingClient({
  properties: rawProperties = [],
  total = 0,
  page = 1,
  totalPages = 1,
  cities = [],
  searchParams,
}: ListingClientProps) {
  const router = useRouter();
  const allProps = useMemo(() => mapPropertiesFromApi(rawProperties), [rawProperties]);

  const urlQuery = filtersToQuery(filtersFromParams(searchParams));
  const [filters, setFilters] = useState<Filters>(() => filtersFromParams(searchParams));
  const lastPushed = useRef(urlQuery);
  const [openDrop, setOpenDrop] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // IA
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<V2Property[] | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Si la URL cambia desde afuera (links del nav, back/forward), re-sincronizar estado.
  useEffect(() => {
    if (urlQuery !== lastPushed.current) {
      lastPushed.current = urlQuery;
      setFilters(filtersFromParams(searchParams));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  // Filtros → URL con debounce 300ms (resetea a página 1)
  const filtersKey = filtersToQuery(filters);
  useEffect(() => {
    if (filtersKey === lastPushed.current) return;
    const t = setTimeout(() => {
      lastPushed.current = filtersKey;
      router.replace('/propiedades' + (filtersKey ? '?' + filtersKey : ''), { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [filtersKey, router]);

  function set<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
  }

  function goPage(n: number) {
    const qs = filtersToQuery(filters, n);
    lastPushed.current = filtersToQuery(filters);
    router.replace('/propiedades' + (qs ? '?' + qs : ''), { scroll: true });
  }

  function toggleAmenity(a: string) {
    setFilters((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  }

  // Cerrar dropdowns al click afuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (e.target instanceof Element && !e.target.closest('.filter-bar')) setOpenDrop(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function handleAiSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = aiQuery.trim();
    if (query.length < 3) return;
    setAiLoading(true);
    setAiNotice(null);
    try {
      const res = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 12 }),
      });
      const json = (await res.json().catch(() => ({}))) as { results?: Record<string, unknown>[] };
      if (res.ok && Array.isArray(json.results) && json.results.length > 0) {
        setAiResults(mapPropertiesFromApi(json.results));
        return;
      }
      // Fallback: búsqueda de texto
      setAiResults(null);
      setAiNotice(res.ok ? 'Sin resultados semánticos — mostrando coincidencias de texto.' : 'Búsqueda IA no disponible — mostrando coincidencias de texto.');
      set('q', query);
    } catch {
      setAiResults(null);
      setAiNotice('Búsqueda IA no disponible — mostrando coincidencias de texto.');
      set('q', query);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSaveSearch() {
    setSaveMsg(null);
    const name = [filters.tipo || 'Propiedades', filters.ciudad && `en ${filters.ciudad}`].filter(Boolean).join(' ');
    const res = await createSavedSearch(name, {
      ciudad: filters.ciudad || undefined,
      tipo: filters.tipo || undefined,
      precioMin: filters.precio_min ? Number(filters.precio_min) : undefined,
      precioMax: filters.precio_max ? Number(filters.precio_max) : undefined,
      bedrooms: filters.dormitorios ? Number(filters.dormitorios) : undefined,
    });
    if (res.success) {
      setSaveMsg('Búsqueda guardada. Te avisamos cuando haya novedades.');
    } else if (res.error?.toLowerCase().includes('sesión')) {
      router.push(`/auth/login?redirect=${encodeURIComponent('/propiedades' + (filtersKey ? '?' + filtersKey : ''))}`);
    } else {
      setSaveMsg(res.error ?? 'No se pudo guardar la búsqueda.');
    }
  }

  const list = aiResults ?? allProps;
  const mapItems: MapItem[] = list
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({ id: p.id, title: p.title, lat: p.latitude as number, lng: p.longitude as number, href: getPropertyPath(p), price: p.priceFormatted }));

  const priceLabel =
    filters.precio_min || filters.precio_max
      ? `${filters.precio_min ? fmtUsd(filters.precio_min) : 'USD 0'} – ${filters.precio_max ? fmtUsd(filters.precio_max) : 'sin tope'}`
      : 'Cualquiera';

  const pills: { key: string; label: string; clear: () => void }[] = [];
  if (filters.q) pills.push({ key: 'q', label: `“${filters.q}”`, clear: () => set('q', '') });
  if (filters.tipo) pills.push({ key: 'tipo', label: filters.tipo, clear: () => set('tipo', '') });
  if (filters.ciudad) pills.push({ key: 'ciudad', label: filters.ciudad, clear: () => set('ciudad', '') });
  if (filters.operacion) pills.push({ key: 'op', label: filters.operacion === 'venta' ? 'Venta' : 'Alquiler', clear: () => set('operacion', '') });
  if (filters.precio_min || filters.precio_max)
    pills.push({ key: 'precio', label: priceLabel, clear: () => setFilters((f) => ({ ...f, precio_min: '', precio_max: '' })) });
  if (filters.dormitorios) pills.push({ key: 'dorm', label: `${filters.dormitorios}+ dorm`, clear: () => set('dormitorios', '') });
  if (filters.destacado) pills.push({ key: 'dest', label: 'Destacadas', clear: () => set('destacado', '') });
  filters.amenities.forEach((a) => pills.push({ key: 'a-' + a, label: a, clear: () => toggleAmenity(a) }));

  const clearAll = () => {
    setFilters({ ...EMPTY, orden: filters.orden });
    setAiResults(null);
    setAiNotice(null);
  };

  return (
    <div style={{ background: '#111111', minHeight: '100vh', paddingTop: 80 }}>
      <div className="filter-bar">
        <div className="filter-bar-inner">
          <FilterDropdown id="type" label="Tipo" value={filters.tipo || 'Todos'} open={openDrop === 'type'} onToggle={() => setOpenDrop(openDrop === 'type' ? null : 'type')}>
            <div className="dd-chips" role="listbox" aria-label="Tipo de propiedad">
              {['', ...PROPERTY_TYPES].map((t) => (
                <button key={t || 'all'} type="button" role="option" aria-selected={filters.tipo === t} className={`dd-chip ${filters.tipo === t ? 'active' : ''}`} onClick={() => { set('tipo', t); setOpenDrop(null); }}>
                  {t || 'Todos'}
                </button>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown id="city" label="Ciudad" value={filters.ciudad || 'Todas'} open={openDrop === 'city'} onToggle={() => setOpenDrop(openDrop === 'city' ? null : 'city')}>
            <div className="dd-chips" role="listbox" aria-label="Ciudad">
              {['', ...cities].map((c) => (
                <button key={c || 'all'} type="button" role="option" aria-selected={filters.ciudad === c} className={`dd-chip ${filters.ciudad === c ? 'active' : ''}`} onClick={() => { set('ciudad', c); setOpenDrop(null); }}>
                  {c || 'Todas'}
                </button>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown id="op" label="Operación" value={filters.operacion ? (filters.operacion === 'venta' ? 'Venta' : 'Alquiler') : 'Todas'} open={openDrop === 'op'} onToggle={() => setOpenDrop(openDrop === 'op' ? null : 'op')}>
            <div className="dd-chips" role="listbox" aria-label="Operación">
              {[['', 'Todas'], ['venta', 'Venta'], ['alquiler', 'Alquiler']].map(([v, l]) => (
                <button key={l} type="button" role="option" aria-selected={filters.operacion === v} className={`dd-chip ${filters.operacion === v ? 'active' : ''}`} onClick={() => { set('operacion', v); setOpenDrop(null); }}>
                  {l}
                </button>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown id="price" label="Precio" value={priceLabel} open={openDrop === 'price'} onToggle={() => setOpenDrop(openDrop === 'price' ? null : 'price')} width={320}>
            <div className="dd-range" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label htmlFor="precio-min" className="fb-more-label" style={{ display: 'block', marginBottom: 6 }}>Mínimo (USD)</label>
                <input id="precio-min" type="number" min={0} step={1000} inputMode="numeric" value={filters.precio_min} onChange={(e) => set('precio_min', e.target.value)} placeholder="0" style={priceInputStyle} />
              </div>
              <div>
                <label htmlFor="precio-max" className="fb-more-label" style={{ display: 'block', marginBottom: 6 }}>Máximo (USD)</label>
                <input id="precio-max" type="number" min={0} step={1000} inputMode="numeric" value={filters.precio_max} onChange={(e) => set('precio_max', e.target.value)} placeholder="Sin tope" style={priceInputStyle} />
              </div>
            </div>
          </FilterDropdown>

          <FilterDropdown id="beds" label="Dormitorios" value={filters.dormitorios ? `${filters.dormitorios}+` : 'Todos'} open={openDrop === 'beds'} onToggle={() => setOpenDrop(openDrop === 'beds' ? null : 'beds')}>
            <div className="dd-chips" role="listbox" aria-label="Dormitorios">
              {['', '1', '2', '3', '4', '5'].map((b) => (
                <button key={b || 'all'} type="button" role="option" aria-selected={filters.dormitorios === b} className={`dd-chip ${filters.dormitorios === b ? 'active' : ''}`} onClick={() => { set('dormitorios', b); setOpenDrop(null); }}>
                  {b ? `${b}+` : 'Todos'}
                </button>
              ))}
            </div>
          </FilterDropdown>

          <button type="button" className={`fb-more ${moreOpen ? 'open' : ''}`} onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} data-cursor="hover">
            <span>Más filtros</span>
            <span className="fb-count">{filters.amenities.length > 0 ? filters.amenities.length : ''}</span>
            <span className="fb-chev" aria-hidden>{moreOpen ? '−' : '+'}</span>
          </button>

          <div className="fb-spacer" />

          <SortDropdown value={filters.orden} onChange={(v: string) => set('orden', v)} />

          <button type="button" className="fb-save" onClick={handleSaveSearch} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            ★ Guardar búsqueda
          </button>
        </div>

        {moreOpen && (
          <div className="filter-bar-more">
            <div className="fb-more-label">Características</div>
            <div className="dd-chips">
              <button type="button" aria-pressed={filters.destacado === 'true'} className={`dd-chip ${filters.destacado ? 'active' : ''}`} onClick={() => set('destacado', filters.destacado ? '' : 'true')}>
                ★ Solo destacadas
              </button>
              {AMENITIES_FILTER.map((f) => (
                <button key={f} type="button" aria-pressed={filters.amenities.includes(f)} className={`dd-chip ${filters.amenities.includes(f) ? 'active' : ''}`} onClick={() => toggleAmenity(f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className="listing-split">
        <section className="listing-results">
          <div className="listing-topbar">
            <div className="listing-count" aria-live="polite">
              <span className="num">{aiResults ? aiResults.length : total}</span>{' '}
              <span style={{ fontStyle: 'italic' }}>{(aiResults ? aiResults.length : total) === 1 ? 'propiedad' : 'propiedades'}</span>{' '}
              {aiResults ? 'sugeridas por IA' : 'encontradas'}
              <span className="topbar-meta">en {filters.ciudad || 'todo Paraguay'}</span>
            </div>
            <div className="listing-tools">
              <form className="ai-search" onSubmit={handleAiSearch} role="search">
                <span className="ai-tag" aria-hidden>AI</span>
                <label htmlFor="ai-search-input" className="sr-only" style={srOnly}>Búsqueda con IA</label>
                <input
                  id="ai-search-input"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder='Probá: "Casa con piscina cerca del río"'
                  disabled={aiLoading}
                />
                <button type="submit" className="ai-key" aria-label="Buscar con IA" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} disabled={aiLoading}>
                  {aiLoading ? '…' : '↵'}
                </button>
              </form>
            </div>
          </div>

          {(aiNotice || saveMsg) && (
            <p role="status" style={{ color: 'var(--gray)', fontSize: 13, margin: '0 0 12px' }}>
              {aiNotice || saveMsg}
            </p>
          )}

          <div className="active-filters">
            {aiResults && (
              <span className="active-pill">
                IA: “{aiQuery}”{' '}
                <button type="button" className="x" aria-label="Salir de búsqueda IA" onClick={() => setAiResults(null)} style={xBtnStyle}>×</button>
              </span>
            )}
            {pills.map((pl) => (
              <span key={pl.key} className="active-pill">
                {pl.label}{' '}
                <button type="button" className="x" aria-label={`Quitar filtro ${pl.label}`} onClick={pl.clear} style={xBtnStyle}>×</button>
              </span>
            ))}
            {(pills.length > 0 || aiResults) && (
              <button type="button" className="clear-all" onClick={clearAll}>Limpiar todo</button>
            )}
          </div>

          {list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed var(--gray-line)', borderRadius: 16 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 12 }}>
                No encontramos propiedades <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>con esos filtros.</span>
              </div>
              <p style={{ color: 'var(--gray)', marginBottom: 24 }}>Probá ampliar el rango de precio o quitar algún filtro.</p>
              {pills.length > 0 && (
                <button type="button" className="btn btn-gold" onClick={clearAll}>Limpiar filtros <span className="btn-arrow">→</span></button>
              )}
            </div>
          ) : (
            <div className="prop-list">
              {list.map((p) => (
                <PropertyRow key={p.id} p={p} hovered={hoveredId === p.id} onHover={setHoveredId} />
              ))}
            </div>
          )}

          {!aiResults && totalPages > 1 && (
            <nav className="pagination" aria-label="Paginación">
              <button
                type="button"
                className="chip"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
                style={{ background: 'var(--bg-mid)', color: 'var(--white)', borderColor: 'var(--gray-line)', opacity: page <= 1 ? 0.4 : 1 }}
              >
                ← Anterior
              </button>
              <span>
                página {String(page).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
              </span>
              <button
                type="button"
                className="chip"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
                style={{ background: 'var(--gold)', color: '#0e0e0e', borderColor: 'var(--gold)', opacity: page >= totalPages ? 0.4 : 1 }}
              >
                Siguiente →
              </button>
            </nav>
          )}
        </section>

        <aside className="listing-map" aria-label="Mapa de resultados">
          <div className="map-head-inline">
            <div>
              <div className="map-eyebrow">VISTA EN MAPA</div>
              <div className="map-title">
                {filters.ciudad || 'Paraguay'} · {mapItems.length} con ubicación
              </div>
            </div>
            <div className="map-legend">
              <span className="dot" />
              <span>Propiedades</span>
            </div>
          </div>
          <div className="map-canvas-inline">
            <PropertiesMapDynamic items={mapItems} highlightedId={hoveredId} />
          </div>
        </aside>
      </main>
    </div>
  );
}

const priceInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-dark)',
  border: '1px solid var(--gray-line)',
  borderRadius: 8,
  padding: '8px 10px',
  color: 'var(--white)',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
};
const xBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: 'inherit', padding: 0, font: 'inherit' };
const srOnly: React.CSSProperties = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 };

// ---------- Fila de propiedad ----------
function PropertyRow({ p, hovered, onHover }: { p: V2Property; hovered: boolean; onHover: (id: string | null) => void }) {
  const desc = p.description
    ? p.description.slice(0, 160) + (p.description.length > 160 ? '…' : '')
    : [p.type, p.m2 > 0 && `de ${p.m2} m²`, p.loc && `en ${p.loc.split(',')[0]}`].filter(Boolean).join(' ') + '.';
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => onHover(p.id)} onMouseLeave={() => onHover(null)}>
      <Link href={getPropertyPath(p)} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }} onFocus={() => onHover(p.id)} onBlur={() => onHover(null)}>
        <article className={`prop-row ${hovered ? 'hovered' : ''}`} data-cursor="crosshair">
          <div className="row-img">
            <img src={p.img} alt={p.title} />
            <div className="row-tag">{p.type}</div>
          </div>
          <div className="row-body">
            <div className="row-top">
              <div className="row-meta">
                <span className="row-id">{getPropertyRef(p)}</span>
                <span className="row-loc-pill">
                  <span className="loc-dot" />
                  {p.loc}
                </span>
              </div>
              <div className="row-price">
                {p.price}
                {p.operation_type === 'alquiler' && <span style={{ fontSize: '0.6em', color: 'var(--gray)' }}> /mes</span>}
              </div>
            </div>
            <h3 className="row-title">{p.title}</h3>
            <p className="row-desc">{desc}</p>
            <div className="row-bottom">
              <div className="row-specs">
                {p.beds > 0 && (<><span><strong>{p.beds}</strong> dorm</span><span className="dot-sep">·</span></>)}
                {p.baths > 0 && (<><span><strong>{p.baths}</strong> baños</span><span className="dot-sep">·</span></>)}
                {p.m2 > 0 && <span><strong>{p.m2}</strong> m²</span>}
                {p.m2 > 0 && p.priceN > 0 && p.currency === 'USD' && p.operation_type === 'venta' && (
                  <>
                    <span className="dot-sep">·</span>
                    <span className="row-permm">USD {Math.round(p.priceN / p.m2).toLocaleString('es-PY')}/m²</span>
                  </>
                )}
              </div>
              <div className="row-cta">
                Ver propiedad <span className="row-arrow">→</span>
              </div>
            </div>
          </div>
        </article>
      </Link>
      <FavoriteButton listingId={p.id} style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 3 }} />
    </div>
  );
}

function FilterDropdown({
  id,
  label,
  value,
  open,
  onToggle,
  children,
  width = 240,
}: {
  id: string;
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div className={`fb-drop ${open ? 'open' : ''}`}>
      <button type="button" className="fb-drop-trigger" onClick={onToggle} aria-expanded={open} aria-controls={`fb-panel-${id}`} data-cursor="hover">
        <span className="fb-drop-label">{label}</span>
        <span className="fb-drop-value">{value}</span>
        <span className="fb-drop-chev" aria-hidden>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div id={`fb-panel-${id}`} className="fb-drop-panel" style={{ minWidth: width }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SortDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = [
    { v: '', l: 'Más relevantes', s: 'Destacadas primero' },
    { v: 'precio-asc', l: 'Precio: menor a mayor', s: 'Ascendente' },
    { v: 'precio-desc', l: 'Precio: mayor a menor', s: 'Descendente' },
    { v: 'recientes', l: 'Más recientes', s: 'Últimas publicadas' },
    { v: 'superficie', l: 'Mayor superficie', s: 'M² descendente' },
  ];
  const current = options.find((o) => o.v === value) || options[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={`sort-dd ${open ? 'open' : ''}`} ref={ref}>
      <button type="button" className="sort-trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="listbox" data-cursor="hover">
        <span className="sort-icon" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 4h8M3 7h6M3 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
        <span className="sort-label-stack">
          <span className="sort-key">ORDENAR</span>
          <span className="sort-val">{current.l}</span>
        </span>
        <span className="sort-chev" aria-hidden>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="sort-panel" role="listbox" aria-label="Ordenar por">
          {options.map((o) => (
            <button
              key={o.v || 'rel'}
              type="button"
              role="option"
              aria-selected={value === o.v}
              className={`sort-opt ${value === o.v ? 'active' : ''}`}
              onClick={() => {
                onChange(o.v);
                setOpen(false);
              }}
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
