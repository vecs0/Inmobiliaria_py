'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { createSellerProfile } from '@/lib/actions/seller';
import { homePathForRole, resolveAppRole } from '@/lib/auth/role-utils';
import { safeRedirect } from '@/app/auth/safe-redirect';

type AccountType = 'buyer' | 'particular' | 'empresa' | null;

const emailSchema = z.email({ message: 'Ingresá un email válido' });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Ingresá tu contraseña' }),
});

const personalSchema = z.object({
  name: z.string().trim().min(2, { message: 'Completá tu nombre' }),
  phone: z.string().trim().max(30).optional(),
});

const companySchema = z.object({
  companyName: z.string().trim().min(2, { message: 'Completá la razón social' }),
  ruc: z.string().trim().regex(/^\d{4,10}-?\d$/, { message: 'RUC inválido (ej: 80012345-6)' }),
});

const credentialsSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] });

function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? 'Revisá los datos ingresados';
}

export function LegacyAuthClient({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const isLogin = mode === 'login';
  const redirectTo = safeRedirect(searchParams.get('redirect'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [companyName, setCompanyName] = useState('');
  const [ruc, setRuc] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const totalSteps = isLogin ? 1 : 3;
  const switchHref = (isLogin ? '/auth/register' : '/auth/login') + (redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '');

  // Login y registro son rutas distintas → el componente se remonta y el estado arranca limpio.
  async function redirectAfterAuth(userId: string) {
    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
      return;
    }
    const [{ data: profile }, { data: seller }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
      supabase.from('seller_profiles').select('seller_type').eq('user_id', userId).maybeSingle(),
    ]);
    const role = resolveAppRole(profile?.role, seller?.seller_type, Boolean(seller));
    router.push(homePathForRole(role));
    router.refresh();
  }

  function nextStep() {
    setError(null);
    if (step === 1 && !accountType) {
      setError('Elegí un tipo de cuenta');
      return;
    }
    if (step === 2) {
      const p = personalSchema.safeParse({ name, phone });
      if (!p.success) return setError(firstIssue(p.error));
      if (accountType === 'empresa') {
        const c = companySchema.safeParse({ companyName, ruc });
        if (!c.success) return setError(firstIssue(c.error));
      }
    }
    setStep(step + 1);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) return setError(firstIssue(parsed.error));
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword(parsed.data);
    if (authError) {
      setError(authError.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : authError.message);
      setLoading(false);
      return;
    }
    if (data.user) await redirectAfterAuth(data.user.id);
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accountType) return setError('Elegí un tipo de cuenta');
    const parsed = credentialsSchema.safeParse({ email: email.trim(), password, confirm });
    if (!parsed.success) return setError(firstIssue(parsed.error));

    setLoading(true);
    const profileRole =
      accountType === 'empresa' ? 'seller_empresa' : accountType === 'particular' ? 'seller' : 'user';
    const home = accountType === 'buyer' ? '/comprador' : '/vendedor';
    const next = redirectTo ?? home;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: {
          full_name: accountType === 'empresa' ? companyName : name,
          phone: phone || null,
          seller_type: accountType === 'buyer' ? null : accountType,
          company_name: accountType === 'empresa' ? companyName : null,
          ruc: accountType === 'empresa' ? ruc : null,
          role: profileRole,
        },
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (!authData.user) {
      setError('Error al crear la cuenta');
      setLoading(false);
      return;
    }

    // Confirmación de email activada: no hay sesión todavía → no podemos crear el perfil de vendedor
    // desde el cliente (RLS). Debe crearlo un trigger/callback al confirmar.
    if (!authData.session) {
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    if (accountType === 'particular' || accountType === 'empresa') {
      const res = await createSellerProfile({
        userId: authData.user.id,
        accountType,
        fullName: accountType === 'empresa' ? companyName : name,
        phone: phone || '',
        companyName: accountType === 'empresa' ? companyName : undefined,
        ruc: accountType === 'empresa' ? ruc : undefined,
        hasWebsite: false,
      });
      if (res && 'success' in res && !res.success) {
        setError(res.error ?? 'No pudimos crear tu perfil de vendedor. Probá ingresar de nuevo.');
        setLoading(false);
        return;
      }
    }
    router.push(next);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link href="/" className="auth-back">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Volver al sitio</span>
        </Link>
        <div className="auth-aside-content">
          <div className="auth-logo">
            <span>Inmobiliaria</span>
            <span style={{ color: 'var(--gold)' }}>PY</span>
            <span className="logo-dot" />
          </div>
          <div className="auth-quote">
            <div className="quote-mark">&quot;</div>
            <p>
              El metabuscador premium de Paraguay,
              <span className="quote-em"> sin propiedades duplicadas.</span>
            </p>
            <div className="quote-author">
              <span className="qa-line" />
              <span>Editorial — Asunción · 2026</span>
            </div>
          </div>
          <div className="auth-meta">
            <div className="auth-meta-item">
              <div className="amk">OPERACIONES</div>
              <div className="amv">Venta<span className="unit">+ alquiler</span></div>
            </div>
            <div className="auth-meta-item">
              <div className="amk">COBERTURA</div>
              <div className="amv">Todo<span className="unit">PY</span></div>
            </div>
            <div className="auth-meta-item">
              <div className="amk">BÚSQUEDA</div>
              <div className="amv">IA<span className="unit">semántica</span></div>
            </div>
          </div>
        </div>
        <div className="auth-grid-bg" />
      </aside>

      <section className="auth-form-side">
        <div className="auth-form-inner">
          {!isLogin && (
            <div className="auth-steps">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`auth-step ${step >= s ? 'done' : ''} ${step === s ? 'current' : ''}`}>
                  <span className="auth-step-num">{String(s).padStart(2, '0')}</span>
                  <span className="auth-step-bar" />
                </div>
              ))}
            </div>
          )}

          <div className="auth-eyebrow eyebrow">
            <span className="eyebrow-line" />
            {isLogin ? 'BIENVENIDO DE NUEVO' : `PASO ${step} DE ${totalSteps}`}
          </div>

          <h1 className="auth-title">
            {isLogin && <>Ingresá a tu <span className="italic-accent">cuenta.</span></>}
            {!isLogin && step === 1 && <>¿Cómo querés <span className="italic-accent">empezar?</span></>}
            {!isLogin && step === 2 && accountType === 'empresa' && <>Datos de tu <span className="italic-accent">empresa.</span></>}
            {!isLogin && step === 2 && accountType !== 'empresa' && <>Contanos quién <span className="italic-accent">sos.</span></>}
            {!isLogin && step === 3 && <>Crea tus <span className="italic-accent">credenciales.</span></>}
          </h1>

          <p className="auth-sub">
            {isLogin && 'Accedé a tus búsquedas guardadas, favoritos y alertas de oportunidad.'}
            {!isLogin && step === 1 && 'Elegí el tipo de cuenta que mejor se adapta a tu objetivo en InmobiliariaPY.'}
            {!isLogin && step === 2 && accountType !== 'empresa' && 'Datos personales para personalizar tu experiencia.'}
            {!isLogin && step === 2 && accountType === 'empresa' && 'Información de tu inmobiliaria o constructora.'}
            {!isLogin && step === 3 && 'Email y contraseña para acceder a tu cuenta.'}
          </p>

          {checkEmail && (
            <div className="auth-form" role="status">
              <h2 className="auth-title" style={{ fontSize: 28 }}>
                Revisá tu <span className="italic-accent">email.</span>
              </h2>
              <p className="auth-sub">
                Te enviamos un enlace de confirmación a <strong>{email}</strong>. Abrilo para activar tu cuenta
                {accountType && accountType !== 'buyer' ? ' y terminar de configurar tu perfil de vendedor' : ''}.
              </p>
              <Link href={'/auth/login' + (redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '')} className="auth-submit" style={{ textDecoration: 'none' }}>
                <span className="as-label">Ir a ingresar</span>
                <span className="as-arrow">→</span>
              </Link>
            </div>
          )}

          {isLogin && (
            <form className="auth-form" onSubmit={handleLogin} noValidate>
              <AuthField id="login-email" label="Correo electrónico" type="email" autoComplete="email" value={email} onChange={setEmail} placeholder="vos@ejemplo.com.py" />
              <AuthField id="login-password" label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={setPassword} placeholder="••••••••" rightLabel={<Link href="/auth/reset-password" className="forgot">¿Olvidaste?</Link>} />
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button type="submit" className={`auth-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                <span className="as-label">{loading ? 'Ingresando' : 'Ingresar'}</span>
                <span className="as-arrow">{loading ? <Spinner /> : '→'}</span>
              </button>
              <AuthSocialDivider />
            </form>
          )}

          {!isLogin && !checkEmail && step === 1 && (
            <div className="auth-form">
              <div className="auth-type-list">
                <AccountTypeCard active={accountType === 'buyer'} onClick={() => setAccountType('buyer')} title="Busco propiedades" desc="Encontrá tu próxima propiedad. Sin costo." icon="search" />
                <AccountTypeCard active={accountType === 'particular'} onClick={() => setAccountType('particular')} title="Tengo propiedades" desc="Soy particular y quiero publicar." icon="home" />
                <AccountTypeCard active={accountType === 'empresa'} onClick={() => setAccountType('empresa')} title="Tengo una empresa" desc="Inmobiliaria o constructora." icon="building" />
              </div>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button type="button" onClick={nextStep} className="auth-submit">
                <span className="as-label">Continuar</span>
                <span className="as-arrow">→</span>
              </button>
            </div>
          )}

          {!isLogin && !checkEmail && step === 2 && (
            <div className="auth-form">
              <AuthField id="reg-name" autoComplete="name" label="Nombre y apellido" value={name} onChange={setName} placeholder="María José Benítez" />
              <AuthField id="reg-phone" autoComplete="tel" required={false} label="WhatsApp" hint="+595" type="tel" value={phone} onChange={setPhone} placeholder="981 234 567" />
              {accountType === 'empresa' && (
                <>
                  <AuthField id="reg-company" autoComplete="organization" label="Razón social" value={companyName} onChange={setCompanyName} placeholder="Inmobiliaria del Este S.A." />
                  <AuthField id="reg-ruc" label="RUC" value={ruc} onChange={setRuc} placeholder="80012345-6" />
                </>
              )}
              {error && <div className="auth-error" role="alert">{error}</div>}
              <div className="auth-row">
                <button type="button" onClick={() => setStep(1)} className="auth-back-btn">← Volver</button>
                <button type="button" onClick={nextStep} className="auth-submit">
                  <span className="as-label">Continuar</span>
                  <span className="as-arrow">→</span>
                </button>
              </div>
            </div>
          )}

          {!isLogin && !checkEmail && step === 3 && (
            <form className="auth-form" onSubmit={handleRegister} noValidate>
              <AuthField id="reg-email" label="Correo electrónico" type="email" autoComplete="email" value={email} onChange={setEmail} placeholder="vos@ejemplo.com.py" />
              <AuthField id="reg-password" label="Contraseña" type="password" autoComplete="new-password" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" />
              <AuthField id="reg-confirm" label="Repetir contraseña" type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} placeholder="Repetí la contraseña" />
              {error && <div className="auth-error" role="alert">{error}</div>}
              <div className="auth-row">
                <button type="button" onClick={() => setStep(2)} className="auth-back-btn">← Volver</button>
                <button type="submit" className={`auth-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                  <span className="as-label">{loading ? 'Creando cuenta' : 'Crear cuenta'}</span>
                  <span className="as-arrow">{loading ? <Spinner /> : '→'}</span>
                </button>
              </div>
              <AuthSocialDivider />
            </form>
          )}

          <div className="auth-switch">
            {isLogin ? '¿Sos nuevo en InmobiliariaPY? ' : '¿Ya tenés cuenta? '}
            <Link href={switchHref}>{isLogin ? 'Creá una cuenta' : 'Ingresá'}</Link>
          </div>

          <div className="auth-legal">
            Al continuar aceptás los <Link href="/terminos">Términos</Link> y la <Link href="/privacidad">Política de privacidad</Link>.
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthField({ id, label, hint, rightLabel, type = 'text', value, onChange, placeholder, autoComplete, required = true }: {
  id: string; label: string; hint?: string; rightLabel?: React.ReactNode; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string; required?: boolean;
}) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>
        <span>{label}{hint && <span className="hint">{hint}</span>}</span>
        {rightLabel}
      </label>
      <input id={id} name={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} required={required} />
    </div>
  );
}

function AccountTypeCard({ active, onClick, title, desc, icon }: { active: boolean; onClick: () => void; title: string; desc: string; icon: 'search' | 'home' | 'building' }) {
  const icons = {
    search: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    home: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 9l7-6 7 6v8a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
    building: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 18V4h12v14M8 8h1M11 8h1M8 11h1M11 11h1M8 14h1M11 14h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  };
  return (
    <button type="button" className={`auth-type-card ${active ? 'active' : ''}`} onClick={onClick} aria-pressed={active}>
      <span className="auth-type-icon">{icons[icon]}</span>
      <span className="auth-type-text">
        <span className="auth-type-title">{title}</span>
        <span className="auth-type-desc">{desc}</span>
      </span>
      <span className="auth-type-check">{active ? '●' : '○'}</span>
    </button>
  );
}

function AuthSocialDivider() {
  return null;
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="spinner">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="20" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
