/** URL absoluta basada SOLO en NEXT_PUBLIC_APP_URL (nunca en input del cliente). */
export function appUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
