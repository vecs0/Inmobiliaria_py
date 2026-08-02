"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PROPERTIES, ZONES, IMG } from '@/lib/v2-data';
import { PropertyCard } from '@/components/v2/PropertyCard';
import { mapPropertiesFromApi } from '@/lib/property-adapter';


interface LandingClientProps {
  featuredProperties?: any[];
}

export function LandingClient({ featuredProperties = [] }: LandingClientProps) {
  const router = useRouter();

  // Use real data when available, fall back to mock
  const displayProps = featuredProperties.length > 0
    ? mapPropertiesFromApi(featuredProperties)
    : PROPERTIES;

  const [searchCity, setSearchCity] = React.useState('');
  const [searchType, setSearchType] = React.useState('');
  const [searchBudget, setSearchBudget] = React.useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchCity) params.set('ciudad', searchCity);
    if (searchType) params.set('tipo', searchType);
    router.push('/propiedades' + (params.toString() ? '?' + params.toString() : ''));
  };

  return (
    <div className="page-landing">
      {/* HERO */}
      <section className="hero">
        <div className="hero-mesh" />
        <div className="hero-content">
          <div className="hero-eyebrow eyebrow">
            <span /> PARAGUAY · MERCADO INMOBILIARIO <span />
          </div>
          <h1>
            <span className="line"><span className="word w1 l1">Encuentra tu</span></span>
            <span className="line"><span className="word w2 l2">próxima</span></span>
            <span className="line"><span className="word w3 l3">propiedad.</span></span>
          </h1>
          <p className="sub">Más de 500 propiedades curadas en las mejores zonas del país. De penthouses en Asunción a residencias frente al lago en Ypacaraí.</p>

          <div className="glass-search">
            <div className="field">
              <label>Ciudad</label>
              <select value={searchCity} onChange={e => setSearchCity(e.target.value)}>
                <option value="">Todas</option>
                <option value="Asuncion">Asunción</option>
                <option value="Lambare">Lambaré</option>
                <option value="San Lorenzo">San Lorenzo</option>
                <option value="Ciudad del Este">Ciudad del Este</option>
                <option value="Encarnacion">Encarnación</option>
              </select>
            </div>
            <div className="field">
              <label>Tipo</label>
              <select value={searchType} onChange={e => setSearchType(e.target.value)}>
                <option value="">Todos</option>
                <option value="Casa">Casa</option>
                <option value="Departamento">Departamento</option>
                <option value="Loft">Loft</option>
                <option value="Terreno">Terreno</option>
              </select>
            </div>
            <div className="field">
              <label>Presupuesto</label>
              <select value={searchBudget} onChange={e => setSearchBudget(e.target.value)}>
                <option value="">Cualquiera</option>
                <option value="100-200">USD 100k – 200k</option>
                <option value="200-400">USD 200k – 400k</option>
                <option value="400-700">USD 400k – 700k</option>
                <option value="700+">USD 700k+</option>
              </select>
            </div>
            <button className="search-btn" data-cursor="hover" onClick={handleSearch}>→</button>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="line" />
          <span className="label">Scroll</span>
        </div>
      </section>

      {/* STATS MARQUEE */}
      <div className="marquee">
        <div className="marquee-track">
          {[0, 1].map(rep => (
            <React.Fragment key={rep}>
              <span className="marquee-item"><span className="num">500+</span><span className="label">Propiedades</span></span>
              <span className="marquee-sep">·</span>
              <span className="marquee-item"><span className="num">20+</span><span className="label">Ciudades</span></span>
              <span className="marquee-sep">·</span>
              <span className="marquee-item"><span className="num">4.9</span><span className="star">★</span><span className="label">Calificación</span></span>
              <span className="marquee-sep">·</span>
              <span className="marquee-item"><span className="num">USD 50M+</span><span className="label">En propiedades</span></span>
              <span className="marquee-sep">·</span>
              <span className="marquee-item"><span className="num">85+</span><span className="label">Vendedores activos</span></span>
              <span className="marquee-sep">·</span>
              <span className="marquee-item"><span className="num">12k+</span><span className="label">Usuarios mensuales</span></span>
              <span className="marquee-sep">·</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* FEATURED PROPERTIES */}
      <section className="section" style={{ background: '#111111' }}>
        <div className="section-head">
          <h2>
            Propiedades <span className="italic">destacadas.</span>
          </h2>
          <div className="meta">
            Curadas semanalmente<br />
            por nuestro equipo editorial<br />
            <span style={{ color: 'var(--gold)' }}>— actualizadas recientemente</span>
          </div>
        </div>

        <div className="bento">
          <div className="a">
            <PropertyCard p={displayProps[0]} size="large" />
          </div>
          {displayProps[1] && <PropertyCard p={displayProps[1]} />}
          {displayProps[2] && <PropertyCard p={displayProps[2]} />}
        </div>

        {displayProps.length > 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '24px', maxWidth: '1440px', marginLeft: 'auto', marginRight: 'auto' }}>
            {displayProps.slice(3, 6).map(p => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '64px' }}>
          <Link href="/propiedades" className="btn btn-ghost" data-cursor="hover">
            Ver todas las propiedades <span className="btn-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* ZONES */}
      <section className="zones-section">
        <div className="section-head">
          <h2>Por <span className="italic">zona.</span></h2>
          <div className="meta">
            Cinco ciudades<br />
            cinco vocabularios urbanos<br />
            <span style={{ color: 'var(--gold)' }}>← desliza horizontalmente</span>
          </div>
        </div>
        <ZonesTrack />
      </section>

      {/* CTA SPLIT */}
      <section className="cta-split">
        <div className="cta-half dark" style={{ padding: '100px 60px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div className="eyebrow" style={{ marginBottom: '24px' }}>PARA VENDEDORES</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', marginBottom: '16px', fontWeight: 300 }}>¿Querés <span className="accent" style={{ fontStyle: 'italic', color: 'var(--gold)' }}>vender?</span></h3>
          <p style={{ color: 'var(--gray)', fontSize: '16px', maxWidth: '400px', marginBottom: '40px', lineHeight: 1.6 }}>Publicá tu propiedad en menos de 5 minutos. Llegamos a más de 12.000 compradores activos al mes en Paraguay.</p>
          <div>
            <Link href="/vendedor/propiedades/nueva" className="btn btn-gold" data-cursor="hover">
              Publicar propiedad <span className="btn-arrow">→</span>
            </Link>
          </div>
          <div className="bignum" style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '120px', fontFamily: 'var(--font-serif)', fontWeight: 300, color: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }}>01</div>
        </div>
        <div className="cta-half navy" style={{ background: 'var(--navy-deep)', padding: '100px 60px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div className="eyebrow" style={{ marginBottom: '24px', color: 'var(--gold-light)' }}>PARA AGENCIAS</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', marginBottom: '16px', fontWeight: 300 }}>¿Sos <span className="accent" style={{ fontStyle: 'italic', color: 'var(--gold)' }}>agencia?</span></h3>
          <p style={{ color: 'var(--gray)', fontSize: '16px', maxWidth: '400px', marginBottom: '40px', lineHeight: 1.6 }}>Integrá nuestro inventario con tu sitio mediante API o widget embebible. Tarifas mayoristas para agencias con +50 propiedades.</p>
          <div>
            <Link href="/api-docs" className="btn btn-ghost" data-cursor="hover">
              Ver API & planes <span className="btn-arrow">→</span>
            </Link>
          </div>
          <div className="bignum" style={{ position: 'absolute', bottom: '20px', right: '40px', fontSize: '120px', fontFamily: 'var(--font-serif)', fontWeight: 300, color: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }}>02</div>
        </div>
      </section>

      {/* FOOTER */}
      <DarkFooterV2 />
    </div>
  );
}

// Zones track con drag-scroll + nav buttons
function ZonesTrack() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);
  const router = useRouter();

  const updateEdges = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);

    let isDown = false, startX = 0, scrollStart = 0, moved = 0;
    const down = (e: MouseEvent) => { isDown = true; moved = 0; startX = e.pageX; scrollStart = el.scrollLeft; el.classList.add('dragging'); };
    const move = (e: MouseEvent) => { if (!isDown) return; moved = Math.abs(e.pageX - startX); el.scrollLeft = scrollStart - (e.pageX - startX); };
    const up = () => { isDown = false; el.classList.remove('dragging'); };
    const clickGuard = (e: MouseEvent) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } };
    const onWheel = (e: WheelEvent) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.scrollLeft += e.deltaY; e.preventDefault(); } };

    el.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    el.addEventListener('click', clickGuard, true);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
      el.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      el.removeEventListener('click', clickGuard, true);
      el.removeEventListener('wheel', onWheel);
    };
  }, [updateEdges]);

  function nudge(dir: number) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.zone-card') as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : 400;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <div className="zones-wrap">
      <button className={`zones-nav left ${atStart ? 'disabled' : ''}`} onClick={() => nudge(-1)} aria-label="Anterior" data-cursor="hover">
        <span className="arrow">←</span>
      </button>
      <div className="zones-track" ref={trackRef}>
        {ZONES.map((z, i) => (
          <article
            key={z.name}
            className="zone-card"
            data-cursor="crosshair"
            onClick={() => router.push('/propiedades?ciudad=' + encodeURIComponent(z.name))}
          >
            <img src={z.img} alt={z.name} draggable="false" />
            <div className="overlay">
              <div>
                <div className="idx">0{i + 1} / 0{ZONES.length}</div>
              </div>
              <div>
                <h3>{z.name}</h3>
                <div className="count">{z.count} propiedades disponibles</div>
              </div>
            </div>
            <div className="explore">Explorar →</div>
          </article>
        ))}
      </div>
      <button className={`zones-nav right ${atEnd ? 'disabled' : ''}`} onClick={() => nudge(1)} aria-label="Siguiente" data-cursor="hover">
        <span className="arrow">→</span>
      </button>
    </div>
  );
}

// Footer v2
function DarkFooterV2() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="name">InmobiliariaPY<span style={{ color: 'var(--gold)' }}>.</span></div>
          <p>El mercado inmobiliario premium de Paraguay. Curaduría editorial de propiedades en Asunción, Lambaré, Ciudad del Este y más.</p>
        </div>
        <div>
          <h4>Explorar</h4>
          <ul>
            <li><Link href="/propiedades">Propiedades</Link></li>
            <li><Link href="/propiedades?operacion=venta">Comprar</Link></li>
            <li><Link href="/propiedades?operacion=alquiler">Alquilar</Link></li>
            <li><Link href="/propiedades?destacado=true">Destacadas</Link></li>
          </ul>
        </div>
        <div>
          <h4>Empresa</h4>
          <ul>
            <li><Link href="/vendedor">Portal vendedor</Link></li>
            <li><Link href="/">API · Widget</Link></li>
            <li><Link href="/auth/register">Crear cuenta</Link></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><Link href="/">Términos</Link></li>
            <li><Link href="/">Privacidad</Link></li>
            <li><Link href="/">Cookies</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} — INMOBILIARIAPY · ASUNCIÓN, PY</span>
        <span>—25.2867° S · —57.3333° W</span>
      </div>
    </footer>
  );
}
