'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  id: string;
  href: string;
  icon: string;
  label: string;
};

const COMPRADOR_NAV: NavItem[] = [
  { id: 'inicio',        href: '/comprador',              icon: '◇', label: 'Inicio' },
  { id: 'recomendadas',  href: '/comprador/recomendadas', icon: '✦', label: 'Recomendadas' },
  { id: 'favoritos',     href: '/comprador/favoritos',    icon: '♥', label: 'Favoritos' },
  { id: 'alertas',       href: '/comprador/alertas',      icon: '◎', label: 'Alertas' },
  { id: 'recientes',     href: '/comprador/recientes',    icon: '◷', label: 'Recientes' },
];

export function CompradorSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/comprador') return pathname === '/comprador';
    return pathname.startsWith(href);
  }

  return (
    <div className="dash-shell" style={{ paddingTop: 0, minHeight: '100vh' }}>
      <aside className="dash-sidebar">
        <Link href="/" className="dash-logo" style={{ textDecoration: 'none' }}>
          <span>Inmobiliaria</span>
          <span style={{ color: 'var(--gold)' }}>PY</span>
          <span className="dot" />
        </Link>

        <div className="dash-nav-section">Mi Panel</div>
        <nav className="dash-nav">
          {COMPRADOR_NAV.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={`dash-nav-item ${isActive(n.href) ? 'active' : ''}`}
            >
              <span className="icon" style={{ color: isActive(n.href) ? 'var(--gold)' : undefined }}>
                {n.icon}
              </span>
              <span style={{ flex: 1 }}>{n.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer links */}
        <div style={{ position: 'absolute', bottom: 28, left: 22, right: 22 }}>
          <div
            style={{
              background: 'var(--bg-mid)',
              border: '1px solid rgba(123,168,143,0.2)',
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>
              Explorar
            </div>
            <Link
              href="/propiedades"
              style={{ display: 'block', fontSize: 13, color: 'var(--gray)', textDecoration: 'none', marginBottom: 6, lineHeight: 1.5 }}
            >
              → Catálogo completo
            </Link>
            <Link
              href="/vendedor"
              style={{ display: 'block', fontSize: 13, color: 'var(--gray)', textDecoration: 'none', lineHeight: 1.5 }}
            >
              → Panel vendedor
            </Link>
          </div>
        </div>
      </aside>

      <main className="dash-main">{children}</main>
    </div>
  );
}
