"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Usuarios', icon: '👥' },
    { href: '/admin/properties', label: 'Propiedades', icon: '🏠' },
    { href: '/admin/sellers', label: 'Vendedores', icon: '🏢' },
    { href: '/admin/analytics', label: 'Analíticas', icon: '📈' },
    { href: '/admin/settings', label: 'Configuración', icon: '⚙️' },
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-mid)',
      borderRight: '1px solid var(--gray-line)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--white)', marginBottom: '4px' }}>
          Admin Panel
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--gray)' }}>InmobiliariaPY</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? 'var(--white)' : 'var(--gray)',
                background: isActive ? 'var(--gold)' : 'transparent',
                fontSize: '14px',
                fontWeight: isActive ? '500' : '400',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--gray-line)' }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'var(--gray)',
            fontSize: '14px',
          }}
        >
          <span>←</span>
          Volver al sitio
        </Link>
      </div>
    </aside>
  );
}
