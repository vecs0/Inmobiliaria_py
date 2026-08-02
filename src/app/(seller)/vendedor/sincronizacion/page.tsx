export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/roles';
import { SincronizacionClient } from '@/components/v2/SincronizacionClient';

export default async function SincronizacionPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect('/auth/login');
  if (ctx.sellerType !== 'empresa') redirect('/vendedor');

  // Los logs de sincronización se guardan en localStorage del cliente
  // (no hay tabla de sync_logs en el esquema actual)
  // Se inicializa vacío y se popula desde el cliente
  return <SincronizacionClient initialLogs={[]} />;
}
