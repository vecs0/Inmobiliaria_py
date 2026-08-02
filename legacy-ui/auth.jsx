/* ====================================================
   InmobiliariaPY — Auth (Login + Signup)
   Minimal split layout · dark luxury · with reveal anim
   ==================================================== */

function Auth({ mode, setMode, onSuccess, onClose }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [accountType, setAccountType] = React.useState(null); // 'buyer' | 'particular' | 'empresa'
  const [companyName, setCompanyName] = React.useState('');
  const [ruc, setRuc] = React.useState('');
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const isLogin = mode === 'login';
  // Steps for register: 1 = account type, 2 = personal/company data, 3 = credentials
  const totalSteps = isLogin ? 1 : 3;

  React.useEffect(() => { setStep(1); setError(null); }, [mode]);

  function nextStep() {
    setError(null);
    if (step === 1 && !accountType) { setError('Elegí un tipo de cuenta'); return; }
    if (step === 2) {
      if (!name) { setError('Completá tu nombre'); return; }
      if (accountType === 'empresa' && (!companyName || !ruc)) { setError('Completá los datos de la empresa'); return; }
    }
    setStep(step + 1);
  }

  function submit(e) {
    e.preventDefault();
    setError(null);
    if (!email || !password || (!isLogin && !name)) {
      setError('Completá todos los campos');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({ name: name || email.split('@')[0], email, accountType: accountType || 'buyer' });
    }, 850);
  }

  return (
    <div className="auth-shell">
      {/* Left: ambient panel */}
      <aside className="auth-aside">
        <button className="auth-back" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Volver al sitio</span>
        </button>

        <div className="auth-aside-content">
          <div className="auth-logo">
            <span>Inmobiliaria</span>
            <span style={{ color: 'var(--gold)' }}>PY</span>
            <span className="logo-dot" />
          </div>

          <div className="auth-quote">
            <div className="quote-mark">"</div>
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
              <div className="amk">PROPIEDADES</div>
              <div className="amv">500<span className="unit">+</span></div>
            </div>
            <div className="auth-meta-item">
              <div className="amk">ZONAS</div>
              <div className="amv">15<span className="unit">PY</span></div>
            </div>
            <div className="auth-meta-item">
              <div className="amk">VOLUMEN</div>
              <div className="amv">50M<span className="unit">USD</span></div>
            </div>
          </div>
        </div>

        <div className="auth-grid-bg" />
      </aside>

      {/* Right: form */}
      <section className="auth-form-side">
        <div className="auth-form-inner">
          {!isLogin && (
            <div className="auth-steps">
              {[1, 2, 3].map(s => (
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
            {!isLogin && step === 2 && (accountType === 'empresa' ? <>Datos de tu <span className="italic-accent">empresa.</span></> : <>Contanos quién <span className="italic-accent">sos.</span></>)}
            {!isLogin && step === 3 && <>Crea tus <span className="italic-accent">credenciales.</span></>}
          </h1>

          <p className="auth-sub">
            {isLogin && 'Accedé a tus búsquedas guardadas, favoritos y alertas de oportunidad.'}
            {!isLogin && step === 1 && 'Elegí el tipo de cuenta que mejor se adapta a tu objetivo en InmobiliariaPY.'}
            {!isLogin && step === 2 && accountType !== 'empresa' && 'Datos personales para personalizar tu experiencia.'}
            {!isLogin && step === 2 && accountType === 'empresa' && 'Información de tu inmobiliaria o constructora.'}
            {!isLogin && step === 3 && 'Email y contraseña para acceder a tu cuenta.'}
          </p>

          {/* Login form */}
          {isLogin && (
            <form className="auth-form" onSubmit={submit}>
              <AuthField label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="vos@ejemplo.com.py" />
              <AuthField label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="••••••••" rightLabel={<a className="forgot">¿Olvidaste?</a>} />
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className={`auth-submit ${loading ? 'loading' : ''}`}>
                <span className="as-label">{loading ? 'Ingresando' : 'Ingresar'}</span>
                <span className="as-arrow">{loading ? <Spinner /> : '→'}</span>
              </button>
              <AuthSocialDivider />
            </form>
          )}

          {/* Step 1 — Account type */}
          {!isLogin && step === 1 && (
            <div className="auth-form">
              <div className="auth-type-list">
                <AccountTypeCard id="buyer" active={accountType === 'buyer'} onClick={() => setAccountType('buyer')}
                  title="Busco propiedades" desc="Encontrá tu próxima propiedad. Sin costo, sin compromiso." icon="search" />
                <AccountTypeCard id="particular" active={accountType === 'particular'} onClick={() => setAccountType('particular')}
                  title="Tengo propiedades" desc="Soy particular y quiero publicar propiedades." icon="home" />
                <AccountTypeCard id="empresa" active={accountType === 'empresa'} onClick={() => setAccountType('empresa')}
                  title="Tengo una empresa" desc="Inmobiliaria, constructora o desarrollador." icon="building" />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button onClick={nextStep} className="auth-submit">
                <span className="as-label">Continuar</span>
                <span className="as-arrow">→</span>
              </button>
            </div>
          )}

          {/* Step 2 — Personal/Company data */}
          {!isLogin && step === 2 && (
            <div className="auth-form">
              <AuthField label="Nombre y apellido" value={name} onChange={setName} placeholder="María José Benítez" />
              <AuthField label="WhatsApp" hint="+595" type="tel" value={phone} onChange={setPhone} placeholder="981 234 567" />
              {accountType === 'empresa' && (
                <React.Fragment>
                  <AuthField label="Razón social" value={companyName} onChange={setCompanyName} placeholder="Inmobiliaria del Este S.A." />
                  <AuthField label="RUC" value={ruc} onChange={setRuc} placeholder="80012345-6" />
                </React.Fragment>
              )}
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-row">
                <button onClick={() => setStep(1)} className="auth-back-btn">← Volver</button>
                <button onClick={nextStep} className="auth-submit">
                  <span className="as-label">Continuar</span>
                  <span className="as-arrow">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Credentials */}
          {!isLogin && step === 3 && (
            <form className="auth-form" onSubmit={submit}>
              <AuthField label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="vos@ejemplo.com.py" />
              <AuthField label="Contraseña" type="password" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" />
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-row">
                <button type="button" onClick={() => setStep(2)} className="auth-back-btn">← Volver</button>
                <button type="submit" className={`auth-submit ${loading ? 'loading' : ''}`}>
                  <span className="as-label">{loading ? 'Creando cuenta' : 'Crear cuenta'}</span>
                  <span className="as-arrow">{loading ? <Spinner /> : '→'}</span>
                </button>
              </div>
              <AuthSocialDivider />
            </form>
          )}

          <div className="auth-switch">
            {isLogin ? '¿Sos nuevo en InmobiliariaPY? ' : '¿Ya tenés cuenta? '}
            <a onClick={() => setMode(isLogin ? 'signup' : 'login')}>
              {isLogin ? 'Creá una cuenta' : 'Ingresá'}
            </a>
          </div>

          <div className="auth-legal">
            Al continuar aceptás los <a>Términos</a> y la <a>Política de privacidad</a>.
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthField({ label, hint, rightLabel, type = 'text', value, onChange, placeholder }) {
  return (
    <div className="auth-field">
      <label>
        <span>{label}{hint && <span className="hint">{hint}</span>}</span>
        {rightLabel}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function AccountTypeCard({ id, active, onClick, title, desc, icon }) {
  const icons = {
    search: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    home: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 9l7-6 7 6v8a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    building: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 18V4h12v14M8 8h1M11 8h1M8 11h1M11 11h1M8 14h1M11 14h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  };
  return (
    <button type="button" className={`auth-type-card ${active ? 'active' : ''}`} onClick={onClick}>
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
  return (
    <React.Fragment>
      <div className="auth-divider">
        <span className="line" />
        <span className="or">o continuá con</span>
        <span className="line" />
      </div>
      <div className="auth-social">
        <button type="button" className="auth-social-btn">
          <GoogleIcon />
          <span>Google</span>
        </button>
        <button type="button" className="auth-social-btn">
          <AppleIcon />
          <span>Apple</span>
        </button>
      </div>
    </React.Fragment>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 4v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2c-1.5 0-2.5 1-2.5 1S3 4 3 6c0 3 2 6 4 6 1 0 1.5-.5 2-.5s1 .5 2 .5c1.5 0 3-2 3-4-1 0-2-1-2-2.5S13 3 13 3s-1.5-1-3-1c-1 0-1.5.5-2 .5S8 2 7 2z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="spinner">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="20" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

window.Auth = Auth;
