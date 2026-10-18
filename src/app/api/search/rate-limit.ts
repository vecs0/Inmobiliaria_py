// Rate limit en memoria por IP. Best-effort: en serverless cada instancia tiene su
// propio Map, así que el límite real es aproximado (por instancia caliente).
const hits = new Map<string, { count: number; reset: number }>();

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function rateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}
