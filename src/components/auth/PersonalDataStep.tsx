"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoldInput } from './GoldInput';
import { useRegisterStore } from '@/lib/store/register-store';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface PersonalDataStepProps {
  onValidSubmit: () => void;
  onBack: () => void;
}

export function PersonalDataStep({ onValidSubmit, onBack }: PersonalDataStepProps) {
  const { accountType, formData, actions } = useRegisterStore();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const data = {
    accountType: accountType!,
    fullName: formData.fullName,
    phone: formData.phone,
    cedula: formData.cedula,
    companyName: formData.companyName,
  };

  const isValid = (() => {
    if (!accountType) return false;
    if (accountType === 'buyer') return formData.fullName.trim().length >= 2;
    if (accountType === 'particular') return formData.fullName.trim().length >= 2 && formData.phone.trim().length >= 7;
    if (accountType === 'empresa') return formData.companyName.trim().length >= 2 && formData.phone.trim().length >= 7;
    return false;
  })();

  function handleChange(field: string, value: string) {
    actions.setField(field as keyof typeof formData, value as never);
    if (touched[field]) {
      validateField(field, value);
    }
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData] as string);
  }

  function validateField(field: string, value: string) {
    setErrors((prev) => {
      const next = { ...prev };
      if (field === 'fullName' && value.trim().length < 2) {
        next.fullName = 'Mínimo 2 caracteres';
      } else if (field === 'companyName' && value.trim().length < 2) {
        next.companyName = 'Mínimo 2 caracteres';
      } else if (field === 'phone' && value.trim().length < 7) {
        next.phone = 'Teléfono inválido';
      } else {
        delete next[field as keyof typeof errors];
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountType) return;
    const fieldsToTouch = accountType === 'buyer'
      ? ['fullName']
      : accountType === 'particular'
      ? ['fullName', 'phone']
      : ['companyName', 'phone'];
    setTouched(Object.fromEntries(fieldsToTouch.map((f) => [f, true])));
    if (!isValid) return;
    onValidSubmit();
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-5"
    >
      <AnimatePresence mode="wait">
        {accountType === 'buyer' && (
          <motion.div
            key="buyer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5 overflow-hidden"
          >
            <GoldInput
              label="Nombre completo"
              icon="name"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              error={touched.fullName ? errors.fullName : undefined}
              success={touched.fullName && !errors.fullName && formData.fullName.length >= 2}
              placeholder="Juan García"
              autoComplete="name"
            />
          </motion.div>
        )}

        {accountType === 'particular' && (
          <motion.div
            key="particular"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5 overflow-hidden"
          >
            <GoldInput
              label="Nombre completo"
              icon="name"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              error={touched.fullName ? errors.fullName : undefined}
              success={touched.fullName && !errors.fullName && formData.fullName.length >= 2}
              placeholder="Juan García"
              autoComplete="name"
            />
            <GoldInput
              label="Teléfono"
              icon="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              error={touched.phone ? errors.phone : undefined}
              success={touched.phone && !errors.phone && formData.phone.length >= 7}
              placeholder="+595 21 123 4567"
              autoComplete="tel"
            />
            <GoldInput
              label="Cédula de identidad (opcional)"
              icon="cedula"
              value={formData.cedula}
              onChange={(e) => handleChange('cedula', e.target.value)}
              placeholder="1.234.567"
              autoComplete="off"
            />
          </motion.div>
        )}

        {accountType === 'empresa' && (
          <motion.div
            key="empresa"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5 overflow-hidden"
          >
            <GoldInput
              label="Razón social"
              icon="company"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              onBlur={() => handleBlur('companyName')}
              error={touched.companyName ? errors.companyName : undefined}
              success={touched.companyName && !errors.companyName && formData.companyName.length >= 2}
              placeholder="Inmobiliaria Paraguaya S.A."
              autoComplete="organization"
            />
            <GoldInput
              label="Teléfono comercial"
              icon="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              error={touched.phone ? errors.phone : undefined}
              success={touched.phone && !errors.phone && formData.phone.length >= 7}
              placeholder="+595 21 123 4567"
              autoComplete="tel"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-3.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <motion.button
          type="submit"
          disabled={!isValid}
          whileHover={{ scale: isValid ? 1.01 : 1 }}
          whileTap={{ scale: isValid ? 0.99 : 1 }}
          className="flex-1 py-3.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40"
          style={{ background: '#1a2e4a' }}
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.form>
  );
}
