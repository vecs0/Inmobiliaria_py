export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth/roles';
import { ImportarClient } from '@/components/v2/ImportarClient';

export default async function ImportarPage() {
  const ctx = await getUserContext();
  if (!ctx) redirect('/auth/login');
  if (ctx.sellerType !== 'empresa') redirect('/vendedor');

  return <ImportarClient />;
}
