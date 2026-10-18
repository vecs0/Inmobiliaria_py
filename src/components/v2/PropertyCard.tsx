'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';
import type { V2Property } from '@/lib/property-adapter';
import { getPropertyPath, getPropertyRef } from '@/lib/property-adapter';

/* ───────── Cache compartido de favoritos (GET /api/favorites una sola vez) ───────── */
let favIdsPromise: Promise<Set<string>> | null = null;
let favIds: Set<string> | null = null;
const listeners = new Set<() => void>();

function loadFavoriteIds(): Promise<Set<string>> {
  if (!favIdsPromise) {
    favIdsPromise = fetch('/api/favorites', { credentials: 'same-origin' })
      .then(async (r) => {
        if (!r.ok) return new Set<string>();
        const json = (await r.json()) as { ids?: string[] };
        return new Set(json.ids ?? []);
      })
      .catch(() => new Set<string>())
      .then((s) => {
        favIds = s;
        listeners.forEach((l) => l());
        return s;
      });
  }
  return favIdsPromise;
}

function setFavoriteLocal(id: string, value: boolean) {
  if (!favIds) favIds = new Set();
  if (value) favIds.add(id);
  else favIds.delete(id);
  listeners.forEach((l) => l());
}

export function useIsFavorite(listingId: string, initial?: boolean): boolean {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    if (initial === undefined) loadFavoriteIds();
    return () => {
      listeners.delete(l);
    };
  }, [initial]);
  if (favIds) return favIds.has(listingId);
  return Boolean(initial);
}

/** Botón ♥ — POST/DELETE /api/favorites. Si 401 → login con redirect. */
export function FavoriteButton({
  listingId,
  initialFavorite,
  onToggle,
  style,
  className,
}: {
  listingId: string;
  initialFavorite?: boolean;
  onToggle?: (listingId: string, isFavorite: boolean) => void;
  style?: CSSProperties;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isFav = useIsFavorite(listingId, initialFavorite);
  const [busy, setBusy] = useState(false);

  // Si viene initialFavorite explícito, sembrar el cache local.
  useEffect(() => {
    if (initialFavorite !== undefined && (!favIds || favIds.has(listingId) !== initialFavorite)) {
      setFavoriteLocal(listingId, initialFavorite);
    }
  }, [initialFavorite, listingId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy || !listingId) return;
    const next = !isFav;
    setBusy(true);
    setFavoriteLocal(listingId, next);
    try {
      const res = next
        ? await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listingId }),
          })
        : await fetch(`/api/favorites?listingId=${encodeURIComponent(listingId)}`, { method: 'DELETE' });
      if (res.status === 401) {
        setFavoriteLocal(listingId, !next);
        const back = pathname + (typeof window !== 'undefined' ? window.location.search : '');
        router.push(`/auth/login?redirect=${encodeURIComponent(back)}`);
        return;
      }
      if (!res.ok) {
        setFavoriteLocal(listingId, !next);
        return;
      }
      onToggle?.(listingId, next);
    } catch {
      setFavoriteLocal(listingId, !next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={isFav}
      aria-label={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={className}
      data-cursor="hover"
      style={{
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 999,
        width: 38,
        height: 38,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isFav ? '#ff6b6b' : '#fff',
        fontSize: 18,
        lineHeight: 1,
        cursor: busy ? 'wait' : 'pointer',
        backdropFilter: 'blur(6px)',
        transition: 'color .2s, transform .2s',
        ...style,
      }}
    >
      {isFav ? '♥' : '♡'}
    </button>
  );
}

export function PropertyCard({
  p,
  size = 'normal',
  initialFavorite,
  onToggle,
  showFavorite = true,
}: {
  p: V2Property;
  size?: 'normal' | 'large';
  initialFavorite?: boolean;
  onToggle?: (listingId: string, isFavorite: boolean) => void;
  showFavorite?: boolean;
}) {
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <Link href={getPropertyPath(p)} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        <article className={`prop-card ${size === 'large' ? 'large' : ''}`}>
          <div className="img-wrap">
            <img src={p.img} alt={p.title} />
            <div className="img-grain" />
            <div className="tag">{p.type}</div>
            {p.boosted && <div className="boost-tag">★ DESTACADO</div>}
            {p.operation_type === 'alquiler' && <div className="op-tag">ALQUILER</div>}
            <div className="id-tag" style={{ top: 'auto', bottom: 14 }}>{getPropertyRef(p)}</div>
          </div>
          <div className="body">
            <div className="type">
              {p.type}
              {p.sqm > 0 && ` · ${p.sqm} m²`}
            </div>
            <h3 className="title">{p.title}</h3>
            <div className="loc">{p.loc}</div>
            <div className="price-row">
              <div className="price">
                {p.priceFormatted}
                {p.operation_type === 'alquiler' && <span className="permo">/mes</span>}
              </div>
              <div className="specs">
                {p.bedrooms > 0 && <span>{p.bedrooms} dorm</span>}
                {p.bathrooms > 0 && <span>{p.bathrooms} baños</span>}
                {p.sqm > 0 && <span>{p.sqm} m²</span>}
              </div>
            </div>
          </div>
          <div className="reveal">Ver propiedad</div>
        </article>
      </Link>
      {showFavorite && p.id && (
        <FavoriteButton
          listingId={p.id}
          initialFavorite={initialFavorite}
          onToggle={onToggle}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 3 }}
        />
      )}
    </div>
  );
}
