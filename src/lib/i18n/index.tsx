'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import es from './es.json';
import en from './en.json';

export type Locale = 'es' | 'en';
export type Currency = 'USD' | 'PYG';

type Translations = typeof es;

const dictionaries: Record<Locale, Translations> = { es, en };

const PYG_RATE = Number(process.env.NEXT_PUBLIC_USD_PYG_RATE) || 7800;

const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  PYG: PYG_RATE, // 1 USD = PYG_RATE PYG (env NEXT_PUBLIC_USD_PYG_RATE)
};

export function convertAmount(amount: number, from: Currency, to: Currency): number {
  return (amount / EXCHANGE_RATES[from]) * EXCHANGE_RATES[to];
}

/** Standalone formatter (usable in server or client code). Amount is interpreted in `from` (default USD). */
export function formatPrice(amount: number, currency: Currency = 'USD', from: Currency = 'USD'): string {
  const value = convertAmount(amount, from, currency);
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-PY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

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
  formatPrice: (amount) => formatPrice(amount, 'USD'),
  convertPrice: (amount) => amount,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');
  const [currency, setCurrencyState] = useState<Currency>('USD');

  useEffect(() => {
    try {
      const l = localStorage.getItem('impy_locale');
      const c = localStorage.getItem('impy_currency');
      if (l === 'es' || l === 'en') setLocaleState(l);
      if (c === 'USD' || c === 'PYG') setCurrencyState(c);
    } catch { /* storage unavailable */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

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

  const convertPrice = convertAmount;

  const formatPriceCtx = useCallback(
    (amount: number, fromCurrency: Currency = 'USD'): string => formatPrice(amount, currency, fromCurrency),
    [currency],
  );

  const value = useMemo(
    () => ({ locale, currency, t, setLocale, setCurrency, formatPrice: formatPriceCtx, convertPrice }),
    [locale, currency, t, setLocale, setCurrency, formatPriceCtx, convertPrice],
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

/** Returns (amount, from?) => string formatted in the user's selected currency. */
export function useFormatPrice() {
  return useContext(I18nContext).formatPrice;
}
