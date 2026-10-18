'use client';

import NavV2 from '@/components/NavV2';
import { DemoPageSwitcher } from '@/components/v2/DemoPageSwitcher';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function PublicChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavV2 />
      {children}
      {DEMO_MODE && <DemoPageSwitcher />}
    </>
  );
}
