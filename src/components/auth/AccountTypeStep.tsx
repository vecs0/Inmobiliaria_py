"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AccountTypeCard } from './AccountTypeCard';
import type { AccountType } from '@/lib/store/register-store';
import { useRegisterStore } from '@/lib/store/register-store';
import { ArrowRight } from 'lucide-react';

interface AccountTypeStepProps {
  onValidSubmit: () => void;
}

export function AccountTypeStep({ onValidSubmit }: AccountTypeStepProps) {
  const { accountType, actions } = useRegisterStore();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountType) return;
    onValidSubmit();
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-4"
    >
      <div className="space-y-3">
        <AccountTypeCard
          type="buyer"
          selected={accountType === 'buyer'}
          onSelect={actions.setAccountType}
          title="Busco propiedades"
          description="Encontrá tu próxima propiedad. Sin costo, sin compromiso."
          icon="buyer"
        />
        <AccountTypeCard
          type="particular"
          selected={accountType === 'particular'}
          onSelect={actions.setAccountType}
          title="Tengo propiedades"
          description="Soy particular y quiero publicar propiedades."
          icon="particular"
        />
        <AccountTypeCard
          type="empresa"
          selected={accountType === 'empresa'}
          onSelect={actions.setAccountType}
          title="Tengo una empresa"
          description="Inmobiliaria, constructora o desarrollador."
          icon="empresa"
        />
      </div>

      <motion.button
        type="submit"
        disabled={!accountType}
        whileHover={{ scale: accountType ? 1.01 : 1 }}
        whileTap={{ scale: accountType ? 0.99 : 1 }}
        className="w-full py-3.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40"
        style={{ background: '#1a2e4a' }}
      >
        Continuar
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.form>
  );
}
