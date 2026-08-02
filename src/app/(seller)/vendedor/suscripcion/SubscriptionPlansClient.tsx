'use client';

import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Plan {
  id: number;
  name: string;
  plan_type: string;
  price_usd: number;
  max_properties: number;
  max_agents: number;
  features: any;
}

interface SubscriptionPlansClientProps {
  plans: Plan[];
  currentPlan?: string;
  status?: string;
}

export function SubscriptionPlansClient({ plans, currentPlan, status }: SubscriptionPlansClientProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleSubscribe = async (planId: number) => {
    setLoadingId(planId);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId,
          successUrl: window.location.origin + '/vendedor/suscripcion?success=true',
          cancelUrl: window.location.origin + '/vendedor/suscripcion?canceled=true',
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Error al iniciar el pago');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.filter(p => p.plan_type !== 'trial').map((plan) => {
        const isCurrent = currentPlan === plan.plan_type;
        const features = Array.isArray(plan.features) ? plan.features : [];

        return (
          <div 
            key={plan.id}
            className={cn(
              "bg-white rounded-2xl p-8 border transition-all duration-300 relative overflow-hidden flex flex-col",
              isCurrent ? "border-[#B8922A] shadow-xl ring-1 ring-[#B8922A]" : "border-gray-200 hover:border-gray-300 shadow-sm"
            )}
          >
            {isCurrent && (
              <div className="absolute top-0 right-0 bg-[#B8922A] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Plan Actual
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#1a2e4a]">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[#1a2e4a]">${plan.price_usd}</span>
                <span className="text-gray-500 font-medium">/mes</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span>Hasta <strong>{plan.max_properties === 9999 ? 'Ilimitadas' : plan.max_properties}</strong> propiedades</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span><strong>{plan.max_agents}</strong> {plan.max_agents === 1 ? 'Agente' : 'Agentes'}</span>
              </li>
              {features.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={isCurrent || loadingId !== null}
              className={cn(
                "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                isCurrent 
                  ? "bg-gray-100 text-gray-400 cursor-default" 
                  : "bg-[#1a2e4a] text-white hover:bg-[#253f64] active:scale-[0.98] shadow-lg shadow-[#1a2e4a]/10"
              )}
            >
              {loadingId === plan.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isCurrent ? (
                'Plan Activo'
              ) : (
                'Seleccionar Plan'
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
