/** Solo acepta rutas relativas internas ("/algo"), nunca "//host", "/\\host", URLs absolutas ni caracteres de control. */
export function safeRedirect(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!v.startsWith('/') || /[\x00-\x20\x7f\\]/.test(v)) return null;
  try {
    const base = 'http://internal.invalid';
    const u = new URL(v, base);
    if (u.origin !== base) return null;
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}
