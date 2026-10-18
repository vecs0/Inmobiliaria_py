'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DashboardPlan } from '@/lib/seller/fetch-dashboard';

type NavItem = {
  id: string;
  href: string;
  icon: string;
  label: string;
  badge?: number;
};

const PANEL_NAV: NavItem[] = [
  { id: 'overview', href: '/vendedor', icon: '◇', label: 'Resumen' },
  { id: 'propiedades', href: '/vendedor/propiedades', icon: '▣', label: 'Mis propiedades' },
  { id: 'leads', href: '/vendedor/leads', icon: '✉', label: 'Consultas' },
  { id: 'destacados', href: '/vendedor/destacados', icon: '★', label: 'Destacar' },
  { id: 'analytics', href: '/vendedor/analytics', icon: '▲', label: 'Analytics' },
];

const ACCOUNT_NAV: NavItem[] = [
  { id: 'perfil', href: '/vendedor/perfil', icon: '◉', label: 'Mi perfil' },
  { id: 'suscripcion', href: '/vendedor/suscripcion', icon: '⚐', label: 'Plan & Stripe' },
  { id: 'api-keys', href: '/vendedor/api-keys', icon: '⚙', label: 'API Keys' },
];

const EMPRESA_NAV: NavItem[] = [
  { id: 'importar', href: '/vendedor/importar', icon: '↑', label: 'Importar XML/CSV' },
  { id: 'agentes', href: '/vendedor/agentes', icon: '◈', label: 'Agentes' },
  { id: 'sincronizacion', href: '/vendedor/sincronizacion', icon: '↻', label: 'Sincronización' },
];

export function SellerShell({
  children,
  plan,
  unreadLeads = 0,
  isEmpresa = false,
}: {
  children: React.ReactNode;
  plan: DashboardPlan;
  unreadLeads?: number;
  isEmpresa?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  const progress = Math.min(100, (plan.activeCount / plan.maxCount) * 100);

  function isActive(href: string) {
    if (href === '/vendedor') return pathname === '/vendedor';
    return pathname.startsWith(href);
  }

  const panelNav = PANEL_NAV.map((n) => {
    if (n.id === 'leads' && unreadLeads > 0) return { ...n, badge: unreadLeads };
    return n;
  });

  return (
    <div className="dash-shell" style={{ paddingTop: 0, minHeight: '100vh' }}>
      <button type="button" className="dash-mobile-toggle" aria-label="Menú" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? '×' : '≡'}
      </button>
      <div className={`dash-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`dash-sidebar${open ? ' open' : ''}`}>
        <Link href="/" className="dash-logo" style={{ textDecoration: 'none' }}>
          <span>Inmobiliaria</span>
          <span style={{ color: 'var(--gold)' }}>PY</span>
          <span className="dot" />
        </Link>

        <div className="dash-nav-section">Panel</div>
        <nav className="dash-nav">
          {panelNav.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              className={`dash-nav-item ${isActive(n.href) ? 'active' : ''}`}
            >
              <span className="icon" style={{ color: isActive(n.href) ? 'var(--gold)' : undefined }}>
                {n.icon}
              </span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
            </Link>
          ))}
        </nav>

        <div className="dash-nav-section">Cuenta</div>
        <nav className="dash-nav">
          {ACCOUNT_NAV.map((n) => (
            <Link key={n.id} href={n.href} className={`dash-nav-item ${isActive(n.href) ? 'active' : ''}`}>
              <span className="icon" style={{ color: isActive(n.href) ? 'var(--gold)' : undefined }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
            </Link>
          ))}
        </nav>

        {isEmpresa && (
          <>
            <div className="dash-nav-section">Empresa</div>
            <nav className="dash-nav">
              {EMPRESA_NAV.map((n) => (
                <Link key={n.id} href={n.href} className={`dash-nav-item ${isActive(n.href) ? 'active' : ''}`}>
                  <span className="icon" style={{ color: isActive(n.href) ? 'var(--gold)' : undefined }}>{n.icon}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                </Link>
              ))}
            </nav>
          </>
        )}

        <div style={{ position: 'absolute', bottom: 28, left: 22, right: 22 }}>
          <div
            style={{
              background: 'var(--bg-mid)',
              border: '1px solid rgba(123,168,143,0.3)',
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.2em',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                }}
              >
                {plan.label}
              </div>
              <Link
                href="/vendedor/suscripcion"
                style={{ fontSize: 10, color: 'var(--gray)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                Cambiar
              </Link>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.5, marginBottom: 12 }}>
              {plan.activeCount} de {plan.maxCount} propiedades activas
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)' }} />
            </div>
          </div>
        </div>
      </aside>

      <main className="dash-main">{children}</main>
    </div>
  );
}
