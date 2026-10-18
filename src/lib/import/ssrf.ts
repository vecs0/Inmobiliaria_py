import { lookup } from 'node:dns/promises';
import net from 'node:net';

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === '::1' || v6 === '::') return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') ||
    v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb');
}

export class FeedFetchError extends Error {}

/** Descarga un feed remoto con protección SSRF (https, IP pública, timeout, 5MB). */
export async function fetchFeedText(rawUrl: string): Promise<string> {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new FeedFetchError('URL inválida'); }
  if (url.protocol !== 'https:') throw new FeedFetchError('Solo se permiten URLs https');
  if (url.username || url.password) throw new FeedFetchError('URL con credenciales no permitida');

  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addrs = net.isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true }).catch(() => {
        throw new FeedFetchError('No se pudo resolver el host');
      });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
    throw new FeedFetchError('Host no permitido');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // redirect: 'error' evita saltar a hosts internos vía 3xx
    const res = await fetch(url, { signal: controller.signal, redirect: 'error' });
    if (!res.ok) throw new FeedFetchError(`El feed respondió ${res.status}`);
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > MAX_BYTES) throw new FeedFetchError('El feed supera 5MB');
    if (!res.body) throw new FeedFetchError('Respuesta vacía');

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        controller.abort();
        throw new FeedFetchError('El feed supera 5MB');
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
  } catch (e) {
    if (e instanceof FeedFetchError) throw e;
    if ((e as Error).name === 'AbortError') throw new FeedFetchError('Tiempo de espera agotado');
    throw new FeedFetchError('No se pudo descargar el feed');
  } finally {
    clearTimeout(timer);
  }
}
