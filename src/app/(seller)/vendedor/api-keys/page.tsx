export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/roles';
import ApiKeysClient from './ApiKeysClient';

export default async function ApiKeysPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect('/auth/login');
  if (ctx.sellerType !== 'empresa') redirect('/vendedor');

  return <ApiKeysClient />;
}
