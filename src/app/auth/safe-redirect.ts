/** Solo acepta rutas relativas internas ("/algo"), nunca "//host" ni "/\\host" ni URLs absolutas. */
export function safeRedirect(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return null;
  if (/[\r\n]/.test(v)) return null;
  return v;
}
