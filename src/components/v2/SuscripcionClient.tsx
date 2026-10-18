'use client';

import { useEffect, useState } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SellerPlan = {
  id: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  stripe_subscription_id: string | null;
  max_properties: number;
  properties_count: number;
  trial_ends_at: string | null;
};

export type PlanRow = {
  id: number;
  name: string;
  plan_type: string;
  price_usd: number;
  max_properties: number;
  max_agents: number;
  features: unknown;
  stripe_price_id: string | null;
};

export type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string | null;
  subscription_plans: { name: string } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number, currency = 'USD'): string {
  return `${currency.toUpperCase()} ${amount.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_PILL: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Activo',    color: '#4caf7d', bg: 'rgba(76,175,125,0.1)' },
  trialing:  { label: 'Trial',     color: 'var(--gold)', bg: 'rgba(200,168,100,0.1)' },
  canceled:  { label: 'Cancelado', color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)' },
  inactive:  { label: 'Inactivo',  color: 'var(--gray)', bg: 'rgba(255,255,255,0.05)' },
  completed: { label: 'Pagado',    color: '#4caf7d', bg: 'rgba(76,175,125,0.1)' },
  pending:   { label: 'Pendiente', color: 'var(--gold)', bg: 'rgba(200,168,100,0.1)' },
  failed:    { label: 'Fallido',   color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)' },
};

function Pill({ status }: { status: string }) {
  const s = STATUS_PILL[status] ?? STATUS_PILL.inactive;
  return (
    <span style={{
      fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '3px 10px', borderRadius: 20,
      color: s.color, background: s.bg, fontFamily: 'var(--font-mono)',
    }}>
      {s.label}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SuscripcionClient({
  seller,
  plans,
  payments,
}: {
  seller: SellerPlan;
  plans: PlanRow[];
  payments: PaymentRow[];
}) {
  const [loadingPlan, setLoadingPlan] = useState<number | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelDone, setCancelDone] = useState(seller.subscription_status === 'canceled');
  const [cancelPending, setCancelPending] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('status');
    if (s === 'success' || s === 'cancel') setCheckoutStatus(s);
  }, []);

  const progress = Math.min(100, Math.round((seller.properties_count / seller.max_properties) * 100));
  const usedColor = progress >= 90 ? '#ff6b6b' : progress >= 70 ? 'var(--gold)' : '#4caf7d';

  const currentStatus = seller.subscription_status ?? 'inactive';
  const currentPlanName = seller.subscription_plan ?? 'trial';
  const canCancel = !!seller.stripe_subscription_id && !cancelDone && !cancelPending && currentStatus !== 'inactive';

  // Planes visibles: excluir trial, ordenar por precio
  const visiblePlans = plans.filter((p) => p.plan_type !== 'trial');

  async function handleSubscribe(planId: number) {
    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? 'Error al iniciar el pago');
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleCancel() {
    setCanceling(true);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCancelPending(true);
        setShowCancelModal(false);
      } else {
        alert(data.error ?? 'Error al cancelar');
      }
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div>
      {checkoutStatus && (
        <div className="dash-panel" style={{ marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 14, color: checkoutStatus === 'success' ? '#4caf7d' : 'var(--gray)' }}>
            {checkoutStatus === 'success'
              ? 'Pago recibido. Tu suscripción se activará en unos instantes.'
              : 'El pago fue cancelado. No se realizó ningún cargo.'}
          </p>
        </div>
      )}
      {/* Topbar */}
      <div className="dash-topbar">
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>PLAN & PAGOS</div>
          <h1>Tu <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>suscripción.</span></h1>
        </div>
      </div>

      {/* ── Plan actual ───────────────────────────────────────────────────────── */}
      <div className="dash-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
              Plan actual
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, margin: 0 }}>
                {currentPlanName.charAt(0).toUpperCase() + currentPlanName.slice(1)}
              </h2>
              <Pill status={currentStatus} />
            </div>
          </div>

          {(cancelDone || cancelPending) && (
            <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '12px 16px', maxWidth: 320 }}>
              <p style={{ color: '#ff6b6b', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Se cancela al final del período. Seguirá activa hasta el fin del período de facturación.
              </p>
            </div>
          )}
        </div>

        {/* Uso de propiedades */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--gray)' }}>Propiedades usadas</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: usedColor }}>
              {seller.properties_count} / {seller.max_properties}
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: usedColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Info grilla */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, paddingTop: 20, borderTop: '1px solid var(--gray-line)' }}>
          <InfoCell label="Estado" value={<Pill status={currentStatus} />} />
          <InfoCell label="Tipo" value={seller.subscription_plan?.includes('empresa') ? 'Empresa' : 'Particular'} />
          {seller.trial_ends_at && (
            <InfoCell label={currentStatus === 'trialing' ? 'Trial hasta' : 'Próxima renovación'} value={formatDate(seller.trial_ends_at)} />
          )}
          {payments[0]?.billing_period_end && (
            <InfoCell label="Período actual hasta" value={formatDate(payments[0].billing_period_end)} />
          )}
        </div>

        {/* Acciones */}
        {canCancel && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--gray-line)' }}>
            <button
              onClick={() => setShowCancelModal(true)}
              style={{ background: 'none', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '8px 18px', color: '#ff6b6b', cursor: 'pointer', fontSize: 13 }}
            >
              Cancelar suscripción
            </button>
          </div>
        )}
      </div>

      {/* ── Cambiar de plan ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
          Planes disponibles
        </div>
        <div className="boost-grid">
          {visiblePlans.map((plan) => {
            const isCurrent = currentPlanName === plan.plan_type;
            const isLoading = loadingPlan === plan.id;
            const features = Array.isArray(plan.features) ? plan.features as string[] : [];
            return (
              <div key={plan.id} className={`boost-plan ${isCurrent ? 'recommended' : ''}`}>
                {isCurrent && <div className="boost-rec">Plan actual</div>}
                <div className="boost-plan-label">{plan.name}</div>
                <div className="boost-plan-price">
                  <span className="amount">USD {plan.price_usd}</span>
                  <span className="per">/mes</span>
                </div>
                <ul className="boost-features">
                  <li><span className="check">✓</span>Hasta {plan.max_properties === 9999 ? 'ilimitadas' : plan.max_properties} propiedades</li>
                  <li><span className="check">✓</span>{plan.max_agents} agente{plan.max_agents !== 1 ? 's' : ''}</li>
                  {features.slice(0, 3).map((f, i) => (
                    <li key={i}><span className="check">✓</span>{f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`boost-cta ${!isCurrent ? 'primary' : ''}`}
                  disabled={isCurrent || isLoading || loadingPlan !== null}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {isLoading ? 'Procesando…' : isCurrent ? 'Plan activo' : 'Seleccionar →'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Historial de pagos ────────────────────────────────────────────────── */}
      <div className="dash-panel" style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
          Historial de pagos
        </div>

        {payments.length === 0 ? (
          <p style={{ color: 'var(--gray)', fontSize: 14 }}>Todavía no hay pagos registrados.</p>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Período</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--fg)' }}>
                    {p.subscription_plans?.name ?? '—'}
                  </td>
                  <td className="gold">{formatAmount(p.amount, p.currency)}</td>
                  <td><Pill status={p.status} /></td>
                  <td style={{ color: 'var(--gray)', fontSize: 13 }}>
                    {p.billing_period_start
                      ? `${formatDate(p.billing_period_start)} – ${formatDate(p.billing_period_end)}`
                      : '—'}
                  </td>
                  <td style={{ color: 'var(--gray)', fontSize: 13 }}>
                    {formatDate(p.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal cancelar ────────────────────────────────────────────────────── */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'var(--bg-mid)', border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: 16, padding: 36, width: '100%', maxWidth: 420, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 12 }}>
              ¿Cancelar tu suscripción?
            </h3>
            <p style={{ color: 'var(--gray)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Tu plan seguirá activo hasta el fin del período de facturación ya pagado. Después no se renovará y pasarás al plan gratuito.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ background: 'none', border: '1px solid var(--gray-line)', borderRadius: 8, padding: '10px 24px', color: 'var(--gray)', cursor: 'pointer', fontSize: 14 }}
              >
                Mantener plan
              </button>
              <button
                onClick={handleCancel}
                disabled={canceling}
                style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: 8, padding: '10px 24px', color: '#ff6b6b', cursor: canceling ? 'not-allowed' : 'pointer', fontSize: 14, opacity: canceling ? 0.6 : 1 }}
              >
                {canceling ? 'Cancelando…' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}
