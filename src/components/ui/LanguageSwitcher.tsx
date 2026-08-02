'use client';

import { useTranslation, Locale } from '@/lib/i18n';

const FLAGS: Record<Locale, string> = { es: '🇵🇾', en: '🇺🇸' };
const LABELS: Record<Locale, string> = { es: 'ES', en: 'EN' };

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  const next: Locale = locale === 'es' ? 'en' : 'es';

  return (
    <button
      onClick={() => setLocale(next)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:border-[#B8922A] hover:text-[#B8922A] transition-colors bg-white text-gray-600"
      title={`Cambiar a ${next === 'es' ? 'Español' : 'English'}`}
    >
      <span>{FLAGS[next]}</span>
      <span>{LABELS[next]}</span>
    </button>
  );
}
