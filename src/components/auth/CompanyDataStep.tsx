"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GoldInput } from './GoldInput';
import { useRegisterStore } from '@/lib/store/register-store';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface CompanyDataStepProps {
  onValidSubmit: () => void;
  onBack: () => void;
}

export function CompanyDataStep({ onValidSubmit, onBack }: CompanyDataStepProps) {
  const { formData, actions } = useRegisterStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isValid = (() => {
    const rucOk = formData.ruc.trim().length >= 6;
    const websiteOk = !formData.hasWebsite || formData.websiteUrl.includes('.');
    return rucOk && websiteOk;
  })();

  function handleChange(field: keyof typeof formData, value: string | boolean) {
    actions.setField(field, value as never);
    if (touched[field as string]) {
      validateField(field as string, value);
    }
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData] as string | boolean);
  }

  function validateField(field: string, value: string | boolean) {
    setErrors((prev) => {
      const next = { ...prev };
      if (field === 'ruc' && typeof value === 'string') {
        if (value.trim().length < 6) next.ruc = 'RUC inválido';
        else if (value.trim().length > 20) next.ruc = 'RUC muy largo';
        else delete next.ruc;
      } else if (field === 'websiteUrl' && typeof value === 'string') {
        if (formData.hasWebsite && !value.includes('.')) {
          next.websiteUrl = 'URL inválida';
        } else {
          delete next.websiteUrl;
        }
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ ruc: true, websiteUrl: true });
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
        label="RUC"
        icon="ruc"
        value={formData.ruc}
        onChange={(e) => handleChange('ruc', e.target.value)}
        onBlur={() => handleBlur('ruc')}
        error={touched.ruc ? errors.ruc : undefined}
        success={touched.ruc && !errors.ruc && formData.ruc.length >= 6}
        placeholder="1234567-1"
        autoComplete="off"
      />

      <div className="space-y-3">
        <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: '#1a2e4a' }}>
          ¿Tenés web propia?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleChange('hasWebsite', true)}
            className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
              formData.hasWebsite
                ? 'border-[#B8922A] text-white'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
            style={formData.hasWebsite ? { background: '#B8922A' } : {}}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => handleChange('hasWebsite', false)}
            className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
              !formData.hasWebsite
                ? 'border-[#B8922A] text-white'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
            style={!formData.hasWebsite ? { background: '#B8922A' } : {}}
          >
            No
          </button>
        </div>
      </div>

      {formData.hasWebsite && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
        >
          <GoldInput
            label="URL de tu web"
            icon="website"
            type="url"
            value={formData.websiteUrl}
            onChange={(e) => handleChange('websiteUrl', e.target.value)}
            onBlur={() => handleBlur('websiteUrl')}
            error={touched.websiteUrl ? errors.websiteUrl : undefined}
            success={touched.websiteUrl && !errors.websiteUrl && formData.websiteUrl.includes('.')}
            placeholder="https://tuinmobiliaria.com"
            autoComplete="url"
          />
        </motion.div>
      )}

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
          Crear cuenta
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.form>
  );
}
