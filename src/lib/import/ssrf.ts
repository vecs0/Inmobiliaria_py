import dns from 'node:dns';
import https from 'node:https';
import net from 'node:net';
import type { LookupFunction } from 'node:net';

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

// Rangos no públicos. net.BlockList normaliza IPv6 (formas comprimidas, mayúsculas, etc.).
const blocked = new net.BlockList();
for (const [addr, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 3],
] as const) blocked.addSubnet(addr, prefix, 'ipv4');
for (const [addr, prefix] of [
  ['::', 128], ['::1', 128],
  ['::ffff:0:0', 96],   // IPv4-mapped
  ['::', 96],           // IPv4-compatible (deprecado)
  ['64:ff9b::', 96],    // NAT64
  ['64:ff9b:1::', 48],  // NAT64 local
  ['100::', 64],        // discard
  ['2001::', 32],       // Teredo
  ['2001:db8::', 32],   // documentación
  ['2002::', 16],       // 6to4
  ['fc00::', 7],        // ULA
  ['fe80::', 10],       // link-local
  ['ff00::', 8],        // multicast
] as const) blocked.addSubnet(addr, prefix, 'ipv6');

function isBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return blocked.check(ip, 'ipv4');
  if (family === 6) return blocked.check(ip, 'ipv6');
  return true;
}

export class FeedFetchError extends Error {}

// Lookup que valida CADA dirección en el momento de conectar: evita DNS rebinding
// (la conexión usa exactamente la IP validada, sin segunda resolución).
const safeLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '', 0);
    const list = addresses as dns.LookupAddress[];
    if (list.length === 0 || list.some((a) => isBlockedIp(a.address))) {
      return callback(new FeedFetchError('Host no permitido'), '', 0);
    }
    if (options.all) return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, list);
    callback(null, list[0].address, list[0].family);
  });
};

/** Descarga un feed remoto con protección SSRF (https, IP pública fijada, sin redirects, timeout, 5MB). */
export async function fetchFeedText(rawUrl: string): Promise<string> {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new FeedFetchError('URL inválida'); }
  if (url.protocol !== 'https:') throw new FeedFetchError('Solo se permiten URLs https');
  if (url.username || url.password) throw new FeedFetchError('URL con credenciales no permitida');

  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) && isBlockedIp(host)) throw new FeedFetchError('Host no permitido');

  return new Promise<string>((resolve, reject) => {
    // Deadline total (el timeout de socket solo mide inactividad; un goteo lento lo evadiría)
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    const req = https.get(url, { lookup: safeLookup, timeout: TIMEOUT_MS, signal }, (res) => {
      const status = res.statusCode ?? 0;
      // Sin seguir redirects: un 3xx podría apuntar a un host interno
      if (status < 200 || status >= 300) {
        res.resume();
        return reject(new FeedFetchError(`El feed respondió ${status}`));
      }
      const declared = Number(res.headers['content-length'] ?? 0);
      if (declared > MAX_BYTES) {
        res.destroy();
        return reject(new FeedFetchError('El feed supera 5MB'));
      }
      const chunks: Buffer[] = [];
      let total = 0;
      res.on('data', (chunk: Buffer) => {
        total += chunk.byteLength;
        if (total > MAX_BYTES) {
          res.destroy();
          reject(new FeedFetchError('El feed supera 5MB'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', () =>
        reject(new FeedFetchError(signal.aborted ? 'Tiempo de espera agotado' : 'No se pudo descargar el feed')),
      );
    });
    req.on('timeout', () => req.destroy(new FeedFetchError('Tiempo de espera agotado')));
    req.on('error', (e) =>
      reject(
        e instanceof FeedFetchError ? e
          : signal.aborted ? new FeedFetchError('Tiempo de espera agotado')
          : new FeedFetchError('No se pudo descargar el feed'),
      ),
    );
  });
}
