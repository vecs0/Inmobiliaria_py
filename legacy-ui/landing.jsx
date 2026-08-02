/* ====================================================
   InmobiliariaPY — Landing Page
   ==================================================== */

function Landing({ setPage }) {
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
              <select defaultValue="asuncion">
                <option value="asuncion">Asunción</option>
                <option value="lambare">Lambaré</option>
                <option value="san-lorenzo">San Lorenzo</option>
                <option value="cde">Ciudad del Este</option>
                <option value="encarnacion">Encarnación</option>
              </select>
            </div>
            <div className="field">
              <label>Tipo</label>
              <select defaultValue="casa">
                <option value="casa">Casa</option>
                <option value="depto">Departamento</option>
                <option value="loft">Loft</option>
                <option value="terreno">Terreno</option>
              </select>
            </div>
            <div className="field">
              <label>Presupuesto</label>
              <select defaultValue="200-400">
                <option>USD 100k – 200k</option>
                <option value="200-400">USD 200k – 400k</option>
                <option>USD 400k – 700k</option>
                <option>USD 700k+</option>
              </select>
            </div>
            <button className="search-btn" data-cursor="hover">→</button>
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
            <span style={{ color: 'var(--gold)' }}>— actualizadas hace 2 días</span>
          </div>
        </div>

        <div className="bento">
          <div className="a"><PropertyCard p={PROPERTIES[0]} size="large" /></div>
          <PropertyCard p={PROPERTIES[1]} />
          <PropertyCard p={PROPERTIES[2]} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 24, maxWidth: 1440, marginLeft: 'auto', marginRight: 'auto' }}>
          {PROPERTIES.slice(3, 6).map(p => <PropertyCard key={p.id} p={p} />)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 64 }}>
          <button className="btn btn-ghost" onClick={() => setPage('listing')}>
            Ver todas las propiedades <span className="btn-arrow">→</span>
          </button>
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
        <div className="cta-half dark">
          <div className="eyebrow" style={{ marginBottom: 24 }}>PARA VENDEDORES</div>
          <h3>¿Querés <span className="accent">vender?</span></h3>
          <p>Publicá tu propiedad en menos de 5 minutos. Llegamos a más de 12.000 compradores activos al mes en Paraguay.</p>
          <div>
            <button className="btn btn-gold" onClick={() => setPage('dashboard')}>
              Publicar propiedad <span className="btn-arrow">→</span>
            </button>
          </div>
          <div className="bignum">01</div>
        </div>
        <div className="cta-half navy">
          <div className="eyebrow" style={{ marginBottom: 24, color: 'var(--gold-light)' }}>PARA AGENCIAS</div>
          <h3>¿Sos <span className="accent">agencia?</span></h3>
          <p>Integrá nuestro inventario con tu sitio mediante API o widget embebible. Tarifas mayoristas para agencias con +50 propiedades.</p>
          <div>
            <button className="btn btn-ghost">
              Ver planes <span className="btn-arrow">→</span>
            </button>
          </div>
          <div className="bignum">02</div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

window.Landing = Landing;

// ----- Zones track w/ drag-scroll + edge buttons -----
function ZonesTrack() {
  const trackRef = React.useRef(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

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

    // Drag-to-scroll (mouse)
    let isDown = false, startX = 0, scrollStart = 0, moved = 0;
    function down(e) {
      if (e.button !== undefined && e.button !== 0) return;
      isDown = true;
      moved = 0;
      startX = e.pageX;
      scrollStart = el.scrollLeft;
      el.classList.add('dragging');
    }
    function move(e) {
      if (!isDown) return;
      const dx = e.pageX - startX;
      moved = Math.abs(dx);
      el.scrollLeft = scrollStart - dx;
    }
    function up() {
      if (!isDown) return;
      isDown = false;
      el.classList.remove('dragging');
    }
    function clickGuard(e) {
      // Suppress click after a real drag
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; }
    }
    el.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    el.addEventListener('click', clickGuard, true);

    // Wheel: allow vertical wheel to scroll horizontally over the track
    function onWheel(e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }
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

  function nudge(dir) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.zone-card');
    const step = card ? card.offsetWidth + 24 : 400;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <div className="zones-wrap">
      <button
        className={`zones-nav left ${atStart ? 'disabled' : ''}`}
        onClick={() => nudge(-1)}
        aria-label="Anterior"
        data-cursor="hover"
      >
        <span className="arrow">←</span>
      </button>
      <div className="zones-track" ref={trackRef}>
        {ZONES.map((z, i) => (
          <article key={z.slug} className="zone-card">
            <img src={z.img} alt={z.name} draggable="false" />
            <div className="overlay">
              <div>
                <div className="idx">0{i + 1} / 0{ZONES.length}</div>
              </div>
              <div>
                <div className="zone-rent">
                  <span className="zone-rent-k">Rentabilidad</span>
                  <span className="zone-rent-v">{z.rentability}</span>
                </div>
                <h3>{z.name}</h3>
                <div className="count">{z.count} propiedades · {z.profile}</div>
              </div>
            </div>
            <div className="explore">Explorar →</div>
          </article>
        ))}
      </div>
      <button
        className={`zones-nav right ${atEnd ? 'disabled' : ''}`}
        onClick={() => nudge(1)}
        aria-label="Siguiente"
        data-cursor="hover"
      >
        <span className="arrow">→</span>
      </button>
    </div>
  );
}
