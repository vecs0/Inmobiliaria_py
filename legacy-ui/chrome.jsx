/* ====================================================
   InmobiliariaPY — Shared chrome (Cursor, Nav, Grain)
   ==================================================== */

const { useState, useEffect, useRef } = React;

// ----- Custom cursor — removed (no-op stub for any old import refs) -----
function CustomCursor() { return null; }

// ----- Top Navigation -----
function Nav({ page, setPage, solid = false, onBack, user, onAuth, onLogout }) {
  const baseLinks = [
    { id: 'landing', label: 'Inicio' },
    { id: 'listing', label: 'Propiedades' },
    { id: 'dashboard', label: 'Vendedor' }
  ];
  const links = page === 'detail'
    ? [...baseLinks, { id: 'detail', label: 'Propiedad' }]
    : baseLinks;

  const [userMenu, setUserMenu] = React.useState(false);
  React.useEffect(() => {
    const onDoc = (e) => { if (!e.target.closest('.nav-user')) setUserMenu(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <nav className={`nav ${solid ? 'solid' : ''}`}>
      <div className="nav-left">
        {onBack && (
          <button className="nav-back" onClick={onBack} data-cursor="hover" aria-label="Volver">
            <span className="nav-back-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="nav-back-label">Volver</span>
          </button>
        )}
        <a className="nav-logo" onClick={() => setPage('landing')}>
          <span>Inmobiliaria</span>
          <span style={{ color: 'var(--gold)' }}>PY</span>
          <span className="dot" />
        </a>
      </div>
      <div className="nav-links">
        {links.map(l => (
          <a key={l.id} className={page === l.id ? 'active' : ''} onClick={() => setPage(l.id)}>
            {l.label}
          </a>
        ))}
      </div>
      <div className="nav-right">
        <span className="lang">ES · PY</span>
        {user ? (
          <div className="nav-user">
            <button className="nav-user-trigger" onClick={() => setUserMenu(!userMenu)} data-cursor="hover">
              <span className="nav-user-avatar">{user.name[0].toUpperCase()}</span>
              <span className="nav-user-name">{user.name.split(' ')[0]}</span>
              <span className="nav-user-chev">▾</span>
            </button>
            {userMenu && (
              <div className="nav-user-menu">
                <a onClick={() => { setPage('dashboard'); setUserMenu(false); }}>Mi panel</a>
                <a>Favoritos</a>
                <a>Búsquedas guardadas</a>
                <div className="nav-user-sep" />
                <a onClick={() => { onLogout(); setUserMenu(false); }}>Cerrar sesión</a>
              </div>
            )}
          </div>
        ) : (
          <React.Fragment>
            <a className="ingresar" onClick={() => onAuth('login')}>Ingresar</a>
            <button className="nav-cta" onClick={() => onAuth('signup')} data-cursor="hover">Registrarse</button>
          </React.Fragment>
        )}
      </div>
    </nav>
  );
}

// ----- Footer -----
function Footer() {
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
            <li><a>Propiedades</a></li>
            <li><a>Zonas</a></li>
            <li><a>Vendedores</a></li>
            <li><a>Mapa interactivo</a></li>
          </ul>
        </div>
        <div>
          <h4>Empresa</h4>
          <ul>
            <li><a>Sobre nosotros</a></li>
            <li><a>Para agencias</a></li>
            <li><a>API · Widget</a></li>
            <li><a>Contacto</a></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><a>Términos</a></li>
            <li><a>Privacidad</a></li>
            <li><a>Cookies</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 — INMOBILIARIAPY · ASUNCIÓN, PY</span>
        <span>—25.2867° S · —57.3333° W</span>
      </div>
    </footer>
  );
}

// ----- Page switcher (collapsible prototype nav) -----
function PageSwitcher({ page, setPage }) {
  const [open, setOpen] = React.useState(false);
  const items = [
    { id: 'landing', label: 'Inicio', code: '01' },
    { id: 'listing', label: 'Listado', code: '02' },
    { id: 'dashboard', label: 'Vendedor', code: '03' }
  ];
  const current = items.find(i => i.id === page) || items[0];

  return (
    <div className={`proto-nav ${open ? 'open' : ''}`}>
      <button className="proto-nav-tab" onClick={() => setOpen(!open)} data-cursor="hover" aria-label="Demo navigation">
        <span className="proto-dot" />
        <span className="proto-tab-label">
          <span className="proto-code">{current.code}</span>
          <span className="proto-name">{current.label}</span>
        </span>
        <span className="proto-chev">{open ? '×' : '↗'}</span>
      </button>
      {open && (
        <div className="proto-nav-panel">
          <div className="proto-nav-head">
            <span className="proto-eyebrow">VISTA DE DEMO · ROLES</span>
            <span className="proto-hint">solo en el prototipo</span>
          </div>
          <div className="proto-nav-list">
            {items.map(i => (
              <button
                key={i.id}
                className={`proto-nav-item ${page === i.id ? 'active' : ''}`}
                onClick={() => { setPage(i.id); setOpen(false); }}
              >
                <span className="proto-code">{i.code}</span>
                <span className="proto-name">{i.label}</span>
                {page === i.id && <span className="proto-mark">●</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { CustomCursor, Nav, Footer, PageSwitcher });
