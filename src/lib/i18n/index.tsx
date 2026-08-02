'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import es from './es.json';
import en from './en.json';

export type Locale = 'es' | 'en';
export type Currency = 'USD' | 'PYG';

type Translations = typeof es;

const dictionaries: Record<Locale, Translations> = { es, en };

const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  PYG: 7800, // Approximate exchange rate
};

interface I18nContextValue {
  locale: Locale;
  currency: Currency;
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number, fromCurrency?: Currency) => string;
  convertPrice: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  currency: 'USD',
  t: (key) => key,
  setLocale: () => {},
  setCurrency: () => {},
  formatPrice: (amount) => amount.toString(),
  convertPrice: (amount) => amount,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'es';
    return (localStorage.getItem('impy_locale') as Locale) ?? 'es';
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === 'undefined') return 'USD';
    return (localStorage.getItem('impy_currency') as Currency) ?? 'USD';
  });

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') localStorage.setItem('impy_locale', next);
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    if (typeof window !== 'undefined') localStorage.setItem('impy_currency', next);
  }, []);

  const t = useCallback((key: string): string => {
    const parts = key.split('.');
    let value: any = dictionaries[locale];
    for (const part of parts) {
      if (value == null) return key;
      value = value[part];
    }
    return typeof value === 'string' ? value : key;
  }, [locale]);

  const convertPrice = useCallback((amount: number, from: Currency, to: Currency): number => {
    const inUSD = amount / EXCHANGE_RATES[from];
    return inUSD * EXCHANGE_RATES[to];
  }, []);

  const formatPrice = useCallback((amount: number, fromCurrency: Currency = 'USD'): string => {
    const convertedAmount = convertPrice(amount, fromCurrency, currency);
    
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(convertedAmount);
    } else {
      return new Intl.NumberFormat('es-PY', {
        style: 'currency',
        currency: 'PYG',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(convertedAmount);
    }
  }, [currency, convertPrice]);

  return (
    <I18nContext.Provider value={{ locale, currency, t, setLocale, setCurrency, formatPrice, convertPrice }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
