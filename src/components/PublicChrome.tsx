'use client';

import NavV2 from '@/components/NavV2';
import { DemoPageSwitcher } from '@/components/v2/DemoPageSwitcher';

export function PublicChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavV2 />
      {children}
      <DemoPageSwitcher />
    </>
  );
}
