import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LegacyAuthClient } from '@/components/v2/LegacyAuthClient';

export const metadata: Metadata = {
  title: 'Crear cuenta | InmobiliariaPY',
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <LegacyAuthClient mode="register" />
    </Suspense>
  );
}
