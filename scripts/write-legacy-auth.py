# -*- coding: utf-8 -*-
from pathlib import Path

TAG = "ZZDIVZZ"
CONTENT = f"""'use client';

import React, {{ useEffect, useState }} from 'react';
import Link from 'next/link';
import {{ useRouter }} from 'next/navigation';
import {{ createClient }} from '@/lib/supabase/client';
import {{ createSellerProfile }} from '@/lib/actions/seller';

type AccountType = 'buyer' | 'particular' | 'empresa' | null;

export function LegacyAuthClient({{ mode }}: {{ mode: 'login' | 'register' }}) {{
  const router = useRouter();
  const supabase = createClient();
  const isLogin = mode === 'login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [companyName, setCompanyName] = useState('');
  const [ruc, setRuc] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = isLogin ? 1 : 3;

  useEffect(() => {{
    setStep(1);
    setError(null);
    setAccountType(null);
  }}, [mode]);

  async function redirectAfterAuth(userId: string) {{
    const {{ data: seller }} = await supabase
      .from('seller_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (seller) {{
      router.push('/vendedor');
      return;
    }}
    const {{ data: profile }} = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (profile?.role === 'admin' || profile?.role === 'agent') {{
      router.push('/admin');
    }} else {{
      router.push('/');
    }}
    router.refresh();
  }}

  function nextStep() {{
    setError(null);
    if (step === 1 && !accountType) {{
      setError('Elegí un tipo de cuenta');
      return;
    }}
    if (step === 2) {{
      if (!name) {{
        setError('Completá tu nombre');
        return;
      }}
      if (accountType === 'empresa' && (!companyName || !ruc)) {{
        setError('Completá los datos de la empresa');
        return;
      }}
    }}
    setStep(step + 1);
  }}

  async function handleLogin(e: React.FormEvent) {{
    e.preventDefault();
    setError(null);
    if (!email || !password) {{
      setError('Completá todos los campos');
      return;
    }}
    setLoading(true);
    const {{ data, error: authError }} = await supabase.auth.signInWithPassword({{ email, password }});
    if (authError) {{
      setError(authError.message);
      setLoading(false);
      return;
    }}
    if (data.user) await redirectAfterAuth(data.user.id);
    setLoading(false);
  }}

  async function handleRegister(e: React.FormEvent) {{
    e.preventDefault();
    setError(null);
    if (!email || !password || !name || !accountType) {{
      setError('Completá todos los campos');
      return;
    }}
    setLoading(true);
    const {{ data: authData, error: authError }} = await supabase.auth.signUp({{
      email,
      password,
      options: {{
        data: {{
          full_name: accountType === 'empresa' ? companyName : name,
          seller_type: accountType,
        }},
      }},
    }});
    if (authError) {{
      setError(authError.message);
      setLoading(false);
      return;
    }}
    if (!authData.user) {{
      setError('Error al crear la cuenta');
      setLoading(false);
      return;
    }}
    if (accountType === 'particular' || accountType === 'empresa') {{
      await createSellerProfile({{
        userId: authData.user.id,
        accountType,
        fullName: accountType === 'empresa' ? companyName : name,
        phone: phone || '',
        companyName: accountType === 'empresa' ? companyName : undefined,
        ruc: accountType === 'empresa' ? ruc : undefined,
        hasWebsite: false,
      }});
      router.push('/vendedor');
    }} else {{
      router.push('/');
    }}
    router.refresh();
    setLoading(false);
  }}

  return (
    <{TAG} className="auth-shell">
      <aside className="auth-aside">
        <Link href="/" className="auth-back">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Volver al sitio</span>
        </Link>
        <{TAG} className="auth-aside-content">
          <{TAG} className="auth-logo">
            <span>Inmobiliaria</span>
            <span style={{{{ color: 'var(--gold)' }}}}>PY</span>
            <span className="logo-dot" />
          </{TAG}>
          <{TAG} className="auth-quote">
            <{TAG} className="quote-mark">&quot;</{TAG}>
            <p>
              El metabuscador premium de Paraguay,
              <span className="quote-em"> sin propiedades duplicadas.</span>
            </p>
            <{TAG} className="quote-author">
              <span className="qa-line" />
              <span>Editorial — Asunción · 2026</span>
            </{TAG}>
          </{TAG}>
          <{TAG} className="auth-meta">
            <{TAG} className="auth-meta-item">
              <{TAG} className="amk">PROPIEDADES</{TAG}>
              <{TAG} className="amv">500<span className="unit">+</span></{TAG}>
            </{TAG}>
            <{TAG} className="auth-meta-item">
              <{TAG} className="amk">ZONAS</{TAG}>
              <{TAG} className="amv">15<span className="unit">PY</span></{TAG}>
            </{TAG}>
            <{TAG} className="auth-meta-item">
              <{TAG} className="amk">VOLUMEN</{TAG}>
              <{TAG} className="amv">50M<span className="unit">USD</span></{TAG}>
            </{TAG}>
          </{TAG}>
        </{TAG}>
        <{TAG} className="auth-grid-bg" />
      </aside>

      <section className="auth-form-side">
        <{TAG} className="auth-form-inner">
          {{!isLogin && (
            <{TAG} className="auth-steps">
              {{[1, 2, 3].map((s) => (
                <{TAG} key={{s}} className={{`auth-step ${{step >= s ? 'done' : ''}} ${{step === s ? 'current' : ''}}`}}>
                  <span className="auth-step-num">{{String(s).padStart(2, '0')}}</span>
                  <span className="auth-step-bar" />
                </{TAG}>
              ))}}
            </{TAG}>
          )}}

          <{TAG} className="auth-eyebrow eyebrow">
            <span className="eyebrow-line" />
            {{isLogin ? 'BIENVENIDO DE NUEVO' : `PASO ${{step}} DE ${{totalSteps}}`}}
          </{TAG}>

          <h1 className="auth-title">
            {{isLogin && <>Ingresá a tu <span className="italic-accent">cuenta.</span></>}}
            {{!isLogin && step === 1 && <>¿Cómo querés <span className="italic-accent">empezar?</span></>}}
            {{!isLogin && step === 2 && accountType === 'empresa' && <>Datos de tu <span className="italic-accent">empresa.</span></>}}
            {{!isLogin && step === 2 && accountType !== 'empresa' && <>Contanos quién <span className="italic-accent">sos.</span></>}}
            {{!isLogin && step === 3 && <>Crea tus <span className="italic-accent">credenciales.</span></>}}
          </h1>

          <p className="auth-sub">
            {{isLogin && 'Accedé a tus búsquedas guardadas, favoritos y alertas de oportunidad.'}}
            {{!isLogin && step === 1 && 'Elegí el tipo de cuenta que mejor se adapta a tu objetivo en InmobiliariaPY.'}}
            {{!isLogin && step === 2 && accountType !== 'empresa' && 'Datos personales para personalizar tu experiencia.'}}
            {{!isLogin && step === 2 && accountType === 'empresa' && 'Información de tu inmobiliaria o constructora.'}}
            {{!isLogin && step === 3 && 'Email y contraseña para acceder a tu cuenta.'}}
          </p>

          {{isLogin && (
            <form className="auth-form" onSubmit={{handleLogin}}>
              <AuthField label="Correo electrónico" type="email" value={{email}} onChange={{setEmail}} placeholder="vos@ejemplo.com.py" />
              <AuthField label="Contraseña" type="password" value={{password}} onChange={{setPassword}} placeholder="••••••••" rightLabel={{<Link href="/auth/reset-password" className="forgot">¿Olvidaste?</Link>}} />
              {{error && <{TAG} className="auth-error">{{error}}</{TAG}>}}
              <button type="submit" className={{`auth-submit ${{loading ? 'loading' : ''}}`}} disabled={{loading}}>
                <span className="as-label">{{loading ? 'Ingresando' : 'Ingresar'}}</span>
                <span className="as-arrow">{{loading ? <Spinner /> : '→'}}</span>
              </button>
              <AuthSocialDivider />
            </form>
          )}}

          {{!isLogin && step === 1 && (
            <{TAG} className="auth-form">
              <{TAG} className="auth-type-list">
                <AccountTypeCard active={{accountType === 'buyer'}} onClick={{() => setAccountType('buyer')}} title="Busco propiedades" desc="Encontrá tu próxima propiedad. Sin costo." icon="search" />
                <AccountTypeCard active={{accountType === 'particular'}} onClick={{() => setAccountType('particular')}} title="Tengo propiedades" desc="Soy particular y quiero publicar." icon="home" />
                <AccountTypeCard active={{accountType === 'empresa'}} onClick={{() => setAccountType('empresa')}} title="Tengo una empresa" desc="Inmobiliaria o constructora." icon="building" />
              </{TAG}>
              {{error && <{TAG} className="auth-error">{{error}}</{TAG}>}}
              <button type="button" onClick={{nextStep}} className="auth-submit">
                <span className="as-label">Continuar</span>
                <span className="as-arrow">→</span>
              </button>
            </{TAG}>
          )}}

          {{!isLogin && step === 2 && (
            <{TAG} className="auth-form">
              <AuthField label="Nombre y apellido" value={{name}} onChange={{setName}} placeholder="María José Benítez" />
              <AuthField label="WhatsApp" hint="+595" type="tel" value={{phone}} onChange={{setPhone}} placeholder="981 234 567" />
              {{accountType === 'empresa' && (
                <>
                  <AuthField label="Razón social" value={{companyName}} onChange={{setCompanyName}} placeholder="Inmobiliaria del Este S.A." />
                  <AuthField label="RUC" value={{ruc}} onChange={{setRuc}} placeholder="80012345-6" />
                </>
              )}}
              {{error && <{TAG} className="auth-error">{{error}}</{TAG}>}}
              <{TAG} className="auth-row">
                <button type="button" onClick={{() => setStep(1)}} className="auth-back-btn">← Volver</button>
                <button type="button" onClick={{nextStep}} className="auth-submit">
                  <span className="as-label">Continuar</span>
                  <span className="as-arrow">→</span>
                </button>
              </{TAG}>
            </{TAG}>
          )}}

          {{!isLogin && step === 3 && (
            <form className="auth-form" onSubmit={{handleRegister}}>
              <AuthField label="Correo electrónico" type="email" value={{email}} onChange={{setEmail}} placeholder="vos@ejemplo.com.py" />
              <AuthField label="Contraseña" type="password" value={{password}} onChange={{setPassword}} placeholder="Mínimo 8 caracteres" />
              {{error && <{TAG} className="auth-error">{{error}}</{TAG}>}}
              <{TAG} className="auth-row">
                <button type="button" onClick={{() => setStep(2)}} className="auth-back-btn">← Volver</button>
                <button type="submit" className={{`auth-submit ${{loading ? 'loading' : ''}}`}} disabled={{loading}}>
                  <span className="as-label">{{loading ? 'Creando cuenta' : 'Crear cuenta'}}</span>
                  <span className="as-arrow">{{loading ? <Spinner /> : '→'}}</span>
                </button>
              </{TAG}>
              <AuthSocialDivider />
            </form>
          )}}

          <{TAG} className="auth-switch">
            {{isLogin ? '¿Sos nuevo en InmobiliariaPY? ' : '¿Ya tenés cuenta? '}}
            <Link href={{isLogin ? '/auth/register' : '/auth/login'}}>{{isLogin ? 'Creá una cuenta' : 'Ingresá'}}</Link>
          </{TAG}>

          <{TAG} className="auth-legal">
            Al continuar aceptás los <Link href="/terminos">Términos</Link> y la <Link href="/privacidad">Política de privacidad</Link>.
          </{TAG}>
        </{TAG}>
      </section>
    </{TAG}>
  );
}}

function AuthField({{ label, hint, rightLabel, type = 'text', value, onChange, placeholder }}: {{
  label: string; hint?: string; rightLabel?: React.ReactNode; type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}}) {{
  return (
    <{TAG} className="auth-field">
      <label>
        <span>{{label}}{{hint && <span className="hint">{{hint}}</span>}}</span>
        {{rightLabel}}
      </label>
      <input type={{type}} value={{value}} onChange={{(e) => onChange(e.target.value)}} placeholder={{placeholder}} required />
    </{TAG}>
  );
}}

function AccountTypeCard({{ active, onClick, title, desc, icon }}: {{ active: boolean; onClick: () => void; title: string; desc: string; icon: 'search' | 'home' | 'building' }}) {{
  const icons = {{
    search: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    home: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 9l7-6 7 6v8a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
    building: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 18V4h12v14M8 8h1M11 8h1M8 11h1M11 11h1M8 14h1M11 14h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  }};
  return (
    <button type="button" className={{`auth-type-card ${{active ? 'active' : ''}}`}} onClick={{onClick}}>
      <span className="auth-type-icon">{{icons[icon]}}</span>
      <span className="auth-type-text">
        <span className="auth-type-title">{{title}}</span>
        <span className="auth-type-desc">{{desc}}</span>
      </span>
      <span className="auth-type-check">{{active ? '●' : '○'}}</span>
    </button>
  );
}}

function AuthSocialDivider() {{
  return (
    <>
      <{TAG} className="auth-divider">
        <span className="line" />
        <span className="or">o continuá con</span>
        <span className="line" />
      </{TAG}>
      <{TAG} className="auth-social">
        <button type="button" className="auth-social-btn"><span>Google</span></button>
        <button type="button" className="auth-social-btn"><span>Apple</span></button>
      </{TAG}>
    </>
  );
}}

function Spinner() {{
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="spinner">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="20" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}}
"""

CONTENT = CONTENT.replace(TAG, "motionSafeImgBlock")
out = Path(__file__).resolve().parents[1] / "src/components/v2/LegacyAuthClient.tsx"
out.write_text(CONTENT, encoding="utf-8")
print("wrote", out)
