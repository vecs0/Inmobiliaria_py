'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Home, Building2, LayoutDashboard } from 'lucide-react';
import type { AppRole } from '@/lib/auth/role-utils';

interface UserData {
  email?: string;
  user_metadata?: { full_name?: string };
}

export default function NavV2() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [appRole, setAppRole] = useState<AppRole>('buyer');
  const [userMenu, setUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user ?? null;
        setUser(u);
        if (!u) {
          setAppRole('buyer');
          return;
        }
        const [{ data: profile }, { data: seller }] = await Promise.all([
          supabase.from('profiles').select('role').eq('id', u.id).maybeSingle(),
          supabase.from('seller_profiles').select('seller_type').eq('user_id', u.id).maybeSingle(),
        ]);
        if (profile?.role === 'admin') setAppRole('admin');
        else if (profile?.role === 'agent') setAppRole('agent');
        else if (seller) setAppRole(seller.seller_type === 'empresa' ? 'seller_empresa' : 'seller_particular');
        else setAppRole('buyer');
      } finally {
        setAuthReady(true);
      }
    }
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => loadUser());
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest?.('.nav-user')) setUserMenu(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserMenu(false);
    router.push('/');
    router.refresh();
  };

  const handleBack = () => {
    if (pathname.startsWith('/propiedades/') && pathname !== '/propiedades') {
      if (typeof window !== 'undefined' && window.history.length > 1) router.back();
      else router.push('/propiedades');
      return;
    }
    if (pathname === '/propiedades') {
      router.push('/');
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userInitial = userName[0]?.toUpperCase() || 'U';
  const isSeller = appRole === 'seller_particular' || appRole === 'seller_empresa';

  const isLanding = pathname === '/';
  const isListing = pathname === '/propiedades';
  const isDetail = pathname?.startsWith('/propiedades/') && pathname !== '/propiedades';
  const isVendedor = pathname?.startsWith('/vendedor');
  const isComprador = pathname?.startsWith('/comprador');

  const showBack = isListing || isDetail || isComprador;
  const navClass = `nav${scrolled || !isLanding ? ' solid' : ''}`;

  const panelHref = isSeller ? '/vendedor' : '/comprador';
  const panelLabel = isSeller ? 'Mi panel' : 'Mi espacio';

  return (
    <>
      <nav className={navClass}>
        <div className="nav-left">
          {showBack && (
            <button type="button" className="nav-back" onClick={handleBack} data-cursor="hover" aria-label="Volver">
              <span className="nav-back-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="nav-back-label">Volver</span>
            </button>
          )}
          <Link className="nav-logo" href="/" data-cursor="hover">
            <span>Inmobiliaria</span>
            <span style={{ color: 'var(--gold)' }}>PY</span>
            <span className="dot" />
          </Link>
        </div>

        <div className="nav-links">
          <Link href="/" className={isLanding ? 'active font-bold text-[#B8922A]' : 'text-white/80 hover:text-white'} data-cursor="hover">
            <span className="flex items-center gap-1.5">
              <Home size={14} className={isLanding ? 'text-[#B8922A]' : 'text-white/60'} />
              <span>Inicio</span>
            </span>
          </Link>
          <Link href="/propiedades" className={isListing || isDetail ? 'active font-bold text-[#B8922A]' : 'text-white/80 hover:text-white'} data-cursor="hover">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className={isListing || isDetail ? 'text-[#B8922A]' : 'text-white/60'} />
              <span>Propiedades</span>
            </span>
          </Link>
          {isDetail && (
            <span className="active font-bold text-[#B8922A]">Propiedad</span>
          )}
          <Link href="/vendedor" className={isVendedor ? 'active font-bold text-[#B8922A]' : 'text-white/80 hover:text-white'} data-cursor="hover">
            <span className="flex items-center gap-1.5">
              <LayoutDashboard size={14} className={isVendedor ? 'text-[#B8922A]' : 'text-white/60'} />
              <span>Vendedor</span>
            </span>
          </Link>
        </div>

        <div className="nav-right">
          <span className="lang">ES · PY</span>

          {!authReady ? null : user ? (
            <div className="nav-user">
              <button
                type="button"
                className="nav-user-trigger"
                onClick={() => setUserMenu(!userMenu)}
                data-cursor="hover"
              >
                <span className="nav-user-avatar">{userInitial}</span>
                <span className="nav-user-name">{userName.split(' ')[0]}</span>
                <span className="nav-user-chev">▾</span>
              </button>
              {userMenu && (
                <div className="nav-user-menu">
                  <Link href={panelHref} onClick={() => setUserMenu(false)}>{panelLabel}</Link>
                  {isSeller ? (
                    <>
                      <Link href="/vendedor/propiedades" onClick={() => setUserMenu(false)}>Mis propiedades</Link>
                      <Link href="/vendedor/leads" onClick={() => setUserMenu(false)}>Consultas</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/comprador#favoritos" onClick={() => setUserMenu(false)}>Favoritos</Link>
                      <Link href="/comprador#alertas" onClick={() => setUserMenu(false)}>Alertas</Link>
                    </>
                  )}
                  <div className="nav-user-sep" />
                  <button type="button" onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '8px 16px', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit', font: 'inherit' }}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className="ingresar" href="/auth/login" data-cursor="hover">Ingresar</Link>
              <Link className="nav-cta" href="/auth/register" data-cursor="hover">Registrarse</Link>
            </>
          )}

          <button
            type="button"
            className="nav-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--white)',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            {mobileOpen ? '×' : '≡'}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div style={{
          position: 'fixed',
          top: 60,
          left: 0,
          right: 0,
          background: 'var(--bg-mid)',
          borderBottom: '1px solid var(--gray-line)',
          padding: '20px 24px',
          zIndex: 998,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {[
            { href: '/', label: 'Inicio' },
            { href: '/propiedades', label: 'Propiedades' },
            { href: '/vendedor', label: 'Portal vendedor' },
            { href: panelHref, label: panelLabel },
            { href: '/auth/login', label: 'Iniciar sesión' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-body)', fontSize: '1rem' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
