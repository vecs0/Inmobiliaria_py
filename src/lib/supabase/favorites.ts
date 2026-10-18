// Helpers de cliente para /api/favorites (usar desde componentes 'use client').
// La sesión viaja por cookies; el servidor deriva el user_id (no se envía desde el cliente).

export type FavoritesResult = { ok: boolean; error?: string };

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

export async function getFavoriteIds(): Promise<string[]> {
  const res = await fetch('/api/favorites', { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) return [];
  const body = (await res.json()) as { ids?: string[] };
  return body.ids ?? [];
}

export async function addFavorite(listingId: string): Promise<FavoritesResult> {
  const res = await fetch('/api/favorites', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId }),
  });
  return res.ok ? { ok: true } : { ok: false, error: await parseError(res) };
}

export async function removeFavorite(listingId: string): Promise<FavoritesResult> {
  const res = await fetch(`/api/favorites?listingId=${encodeURIComponent(listingId)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  return res.ok ? { ok: true } : { ok: false, error: await parseError(res) };
}

export async function toggleFavorite(listingId: string, isFavorite: boolean): Promise<FavoritesResult> {
  return isFavorite ? removeFavorite(listingId) : addFavorite(listingId);
}
