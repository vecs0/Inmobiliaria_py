'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const ITEMS = [
  { code: '01', label: 'Inicio', href: '/' },
  { code: '02', label: 'Listado', href: '/propiedades' },
  { code: '03', label: 'Vendedor', href: '/vendedor' },
] as const;

function resolveActive(pathname: string) {
  if (pathname.startsWith('/vendedor')) return ITEMS[2];
  if (pathname === '/propiedades' || pathname.startsWith('/propiedades/')) return ITEMS[1];
  return ITEMS[0];
}

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function DemoPageSwitcher() {
  if (!DEMO_MODE) return null;
  return <DemoPageSwitcherInner />;
}

function DemoPageSwitcherInner() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const current = useMemo(() => resolveActive(pathname), [pathname]);

  return (
    <div className={`proto-nav ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="proto-nav-tab"
        onClick={() => setOpen(!open)}
        data-cursor="hover"
        aria-label="Navegación demo"
        aria-expanded={open}
      >
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
            {ITEMS.map((item) => {
              const active = item.code === current.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  className={`proto-nav-item ${active ? 'active' : ''}`}
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
                >
                  <span className="proto-code">{item.code}</span>
                  <span className="proto-name">{item.label}</span>
                  {active && <span className="proto-mark">●</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
