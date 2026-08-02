// Planes de Destacados/Ads — InmobiliariaPY
// Precios en USD, se pasan a Stripe como amount_in_cents

export interface BoostPlan {
  key: '7d' | '15d' | '30d';
  label: string;
  days: number;
  priceUsd: number;
  stripePriceId?: string; // optional: si usas Stripe Price objects
  features: string[];
  recommended?: boolean;
}

export const BOOST_PLANS: BoostPlan[] = [
  {
    key: '7d',
    label: '1 Semana',
    days: 7,
    priceUsd: 9.99,
    features: [
      'Posición destacada por 7 días',
      'Badge "Destacado PRO" en la card',
      'Prioridad en resultados de búsqueda',
    ],
  },
  {
    key: '15d',
    label: '2 Semanas',
    days: 15,
    priceUsd: 17.99,
    recommended: true,
    features: [
      'Posición destacada por 15 días',
      'Badge "Destacado PRO" en la card',
      'Prioridad en resultados de búsqueda',
      'Aparece en sección Destacados del inicio',
    ],
  },
  {
    key: '30d',
    label: '1 Mes',
    days: 30,
    priceUsd: 29.99,
    features: [
      'Posición destacada por 30 días',
      'Badge "Destacado PRO" en la card',
      'Máxima prioridad en resultados',
      'Aparece en sección Destacados del inicio',
      'Incluido en newsletter semanal',
    ],
  },
];

export function getPlanByKey(key: string): BoostPlan | undefined {
  return BOOST_PLANS.find((p) => p.key === key);
}
