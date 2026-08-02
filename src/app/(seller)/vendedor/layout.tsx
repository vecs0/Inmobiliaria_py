import React from 'react';
import { redirect } from 'next/navigation';
import { SellerShell } from '@/components/v2/SellerShell';
import { DemoPageSwitcher } from '@/components/v2/DemoPageSwitcher';
import { fetchSellerShellContext } from '@/lib/seller/fetch-dashboard';
import { getUserContext } from '@/lib/auth/roles';

export const revalidate = 0;

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const userCtx = await getUserContext();
  if (!userCtx) redirect('/auth/login');
  if (userCtx.role === 'buyer') redirect('/comprador');

  const ctx = await fetchSellerShellContext();
  if (!ctx) redirect('/auth/login');

  const isEmpresa = userCtx.role === 'seller_empresa';

  return (
  <>
      <SellerShell plan={ctx.plan} unreadLeads={ctx.unreadLeads} isEmpresa={isEmpresa}>
        {children}
      </SellerShell>
      <DemoPageSwitcher />
    </>
  );
}
