'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { BOOST_PLANS, type BoostPlan } from '@/lib/stripe/boost-plans';
import { getSellerBoosts, getSellerProperties } from '@/lib/supabase/boost-actions';
import type { PropertyBoost } from '@/lib/supabase/types';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));
}

const PLAN_LABELS: Record<string, string> = { '7d': '1 semana', '15d': '2 semanas', '30d': '1 mes' };

export function DestacadosV2Client() {
  const searchParams = useSearchParams();
  const [selectedPropId, setSelectedPropId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan>(BOOST_PLANS[1]);
  const [boosts, setBoosts] = useState<PropertyBoost[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (searchParams.get('success')) {
      toast.success('¡Destacado activado! Tu propiedad ya aparece en las primeras posiciones.');
    }
    if (searchParams.get('cancelled')) {
      toast.error('Pago cancelado. Podés intentarlo nuevamente cuando quieras.');
    }
    Promise.all([getSellerBoosts(), getSellerProperties()]).then(([b, p]) => {
      setBoosts(b);
      setProperties(p);
      if (p.length > 0) setSelectedPropId(p[0].id);
      setLoading(false);
    });
  }, [searchParams]);

  function handleCheckout() {
    if (!selectedPropId) {
      toast.error('Seleccioná una propiedad');
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/stripe/boost-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedPropId, planKey: selectedPlan.key }),
      });
      const { url, error } = await res.json();
      if (error) {
        toast.error(error);
        return;
      }
      window.location.href = url;
    });
  }

  const activeBoosts = boosts.filter((b) => b.status === 'active');

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray)' }}>
        Cargando destacados…
      </div>
    );
  }

  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>VISIBILIDAD · STRIPE</div>
          <h1>
            Destacar <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>propiedades.</span>
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 14, marginTop: 8 }}>
            Aumentá la visibilidad de tus mejores propiedades en el listado y en el inicio.
          </p>
        </div>
        {activeBoosts.length > 0 && (
          <div
            style={{
              background: 'rgba(123,168,143,0.12)',
              border: '1px solid rgba(123,168,143,0.35)',
              borderRadius: 10,
              padding: '12px 18px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--gold)' }}>
              {activeBoosts.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.1em' }}>
              ACTIVO{activeBoosts.length !== 1 ? 'S' : ''}
            </div>
          </div>
        )}
      </div>

      <div className="dash-row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="dash-panel">
            <div className="dash-panel-head">
              <div>
                <h3>1 · Seleccioná la propiedad</h3>
                <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4 }}>
                  Elegí qué publicación querés impulsar.
                </div>
              </div>
            </div>
            {properties.length === 0 ? (
              <p style={{ color: 'var(--gray)', fontSize: 14 }}>
                No tenés propiedades activas para destacar.{' '}
                <Link href="/vendedor/propiedades" style={{ color: 'var(--gold)' }}>
                  Ver mis propiedades →
                </Link>
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {properties.map((prop) => (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => setSelectedPropId(prop.id)}
                    className={`boost-plan ${selectedPropId === prop.id ? 'recommended' : ''}`}
                    style={{ textAlign: 'left', cursor: 'pointer' }}
                  >
                    <div className="boost-plan-label">{prop.title}</div>
                    <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 6 }}>{prop.location}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="dash-panel">
            <div className="dash-panel-head">
              <div>
                <h3>2 · Elegí el plan</h3>
                <div className="meta">STRIPE · PAGOS SEGUROS</div>
              </div>
            </div>
            <div className="boost-grid">
              {BOOST_PLANS.map((plan) => (
                <button
                  key={plan.key}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`boost-plan ${plan.recommended ? 'recommended' : ''} ${selectedPlan.key === plan.key ? 'recommended' : ''}`}
                  style={{ textAlign: 'left', cursor: 'pointer' }}
                >
                  {plan.recommended && <div className="boost-rec">★ Recomendado</div>}
                  <div className="boost-plan-label">{plan.label}</div>
                  <div className="boost-plan-price">
                    <span className="amount">USD {plan.priceUsd}</span>
                    <span className="per">/{plan.days}d</span>
                  </div>
                  <ul className="boost-features">
                    {plan.features.map((f, i) => (
                      <li key={i}>
                        <span className="check">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          <div className="dash-panel">
            <div className="dash-panel-head">
              <h3>3 · Confirmar y pagar</h3>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                padding: 16,
                background: 'var(--bg-mid)',
                borderRadius: 10,
              }}
            >
              <div>
                <p style={{ fontSize: 12, color: 'var(--gray)' }}>Plan seleccionado</p>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18 }}>
                  {selectedPlan.label} — {selectedPlan.days} días
                </p>
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--gold)' }}>
                USD {selectedPlan.priceUsd}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-gold"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={isPending || !selectedPropId || properties.length === 0}
              onClick={handleCheckout}
            >
              {isPending ? 'Redirigiendo a Stripe…' : 'Activar destacado →'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--gray)', textAlign: 'center', marginTop: 12 }}>
              Pago seguro con Stripe · sin suscripción recurrente
            </p>
          </div>
        </div>

        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="dash-panel">
            <div className="dash-panel-head">
              <h3>Mis destacados</h3>
            </div>
            {boosts.length === 0 ? (
              <p style={{ color: 'var(--gray)', fontSize: 13 }}>Aún no tenés destacados activos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {boosts.map((boost) => {
                  const prop = properties.find((p) => p.id === boost.property_id);
                  return (
                    <div
                      key={boost.id}
                      style={{ paddingBottom: 12, borderBottom: '1px solid var(--gray-line)' }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 500 }}>{prop?.title ?? 'Propiedad'}</p>
                      <p style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>
                        {PLAN_LABELS[boost.plan_key]} · {boost.status}
                        {boost.status === 'active' && boost.expires_at && (
                          <> · {daysLeft(boost.expires_at)}d restantes</>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="dash-panel"
            style={{ background: 'linear-gradient(135deg, var(--bg-mid), rgba(123,168,143,0.08))' }}
          >
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>¿Cómo funciona?</h3>
            <ul className="boost-features">
              <li><span className="check">✓</span>Prioridad en búsquedas</li>
              <li><span className="check">✓</span>Badge Destacado PRO</li>
              <li><span className="check">✓</span>Activación automática tras el pago</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
