import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY no está definida');
  }
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: '2026-04-22.dahlia',
      appInfo: { name: 'InmobiliariaPY', version: '0.1.0' },
    });
  }
  return _stripe;
}

/** @deprecated Usar getStripe() — evita fallos en build sin env */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop, getStripe());
  },
});
