import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LegacyAuthClient } from '@/components/v2/LegacyAuthClient';

export const metadata: Metadata = {
  title: 'Ingresar | InmobiliariaPY',
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LegacyAuthClient mode="login" />
    </Suspense>
  );
}
