"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { GoldInput } from './GoldInput';
import { PasswordInput } from './PasswordInput';
import type { CredentialsForm } from '@/lib/schemas/register-schemas';
import { credentialsSchema } from '@/lib/schemas/register-schemas';
import { useRegisterStore } from '@/lib/store/register-store';
import { Mail, ArrowRight } from 'lucide-react';

interface CredentialsStepProps {
  onValidSubmit: () => void;
}

export function CredentialsStep({ onValidSubmit }: CredentialsStepProps) {
  const { formData, actions } = useRegisterStore();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const data: CredentialsForm = {
    email: formData.email,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
  };

  const result = credentialsSchema.safeParse(data);
  const isValid = result.success;

  function handleChange(field: 'email' | 'password' | 'confirmPassword', value: string) {
    actions.setField(field, value);
    if (touched[field]) {
      validate(field, value);
    }
  }

  function handleBlur(field: 'email' | 'password' | 'confirmPassword') {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field, formData[field]);
  }

  function validate(field: string, value: string) {
    setErrors((prev) => {
      const next = { ...prev };
      switch (field) {
        case 'email':
          if (!value.includes('@')) next.email = 'Email inválido';
          else delete next.email;
          break;
        case 'password':
          if (value.length < 8) next.password = 'Mínimo 8 caracteres';
          else if (!/[A-Z]/.test(value)) next.password = 'Al menos 1 letra mayúscula';
          else if (!/[0-9]/.test(value)) next.password = 'Al menos 1 número';
          else delete next.password;
          break;
        case 'confirmPassword':
          if (value !== formData.password) next.confirmPassword = 'Las contraseñas no coinciden';
          else delete next.confirmPassword;
          break;
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });
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
      <GoldInput
        label="Email"
        type="email"
        icon="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        onBlur={() => handleBlur('email')}
        error={touched.email ? errors.email : undefined}
        success={touched.email && !errors.email && formData.email.includes('@')}
        placeholder="tu@email.com"
        autoComplete="email"
      />

      <PasswordInput
        label="Contraseña"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        onBlur={() => handleBlur('password')}
        error={touched.password ? errors.password : undefined}
        id="password"
        name="password"
        autoComplete="new-password"
      />

      <PasswordInput
        label="Confirmar contraseña"
        value={formData.confirmPassword}
        onChange={(e) => handleChange('confirmPassword', e.target.value)}
        onBlur={() => handleBlur('confirmPassword')}
        error={touched.confirmPassword ? errors.confirmPassword : undefined}
        id="confirmPassword"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Repetí tu contraseña"
      />

      <motion.button
        type="submit"
        disabled={!isValid}
        whileHover={{ scale: isValid ? 1.01 : 1 }}
        whileTap={{ scale: isValid ? 0.99 : 1 }}
        className="w-full py-3.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40"
        style={{ background: '#1a2e4a' }}
      >
        Continuar
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.form>
  );
}
