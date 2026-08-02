"use client";

import React from 'react';
import { useTranslation, Locale, Currency } from '@/lib/i18n';

export function LanguageCurrencySelector() {
  const { locale, currency, setLocale, setCurrency } = useTranslation();

  const locales: { value: Locale; label: string; flag: string }[] = [
    { value: 'es', label: 'Español', flag: '🇵🇾' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
  ];

  const currencies: { value: Currency; label: string; symbol: string }[] = [
    { value: 'USD', label: 'US Dollar', symbol: '$' },
    { value: 'PYG', label: 'Guaraní', symbol: '₲' },
  ];

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      {/* Language Selector */}
      <div style={{ position: 'relative' }}>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-mid)',
            border: '1px solid var(--gray-line)',
            borderRadius: '8px',
            color: 'var(--white)',
            fontSize: '14px',
            cursor: 'pointer',
            appearance: 'none',
            paddingRight: '32px',
          }}
        >
          {locales.map((loc) => (
            <option key={loc.value} value={loc.value}>
              {loc.flag} {loc.label}
            </option>
          ))}
        </select>
      </div>

      {/* Currency Selector */}
      <div style={{ position: 'relative' }}>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          style={{
            padding: '8px 12px',
            background: 'var(--bg-mid)',
            border: '1px solid var(--gray-line)',
            borderRadius: '8px',
            color: 'var(--white)',
            fontSize: '14px',
            cursor: 'pointer',
            appearance: 'none',
            paddingRight: '32px',
          }}
        >
          {currencies.map((curr) => (
            <option key={curr.value} value={curr.value}>
              {curr.symbol} {curr.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
