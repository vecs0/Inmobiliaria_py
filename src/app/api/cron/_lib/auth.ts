import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * Valida `Authorization: Bearer ${CRON_SECRET}`.
 * Devuelve una respuesta de error, o null si está autorizado.
 * Vercel Cron envía este header automáticamente cuando CRON_SECRET está definida.
 */
export function requireCronSecret(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurada' }, { status: 500 });
  }
  const header = req.headers.get('authorization') ?? '';
  const expected = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(header);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
