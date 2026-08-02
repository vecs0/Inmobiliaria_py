/* ====================================================
   InmobiliariaPY — App Entry
   ==================================================== */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#7BA88F",
  "displayFont": "Playfair Display",
  "showCursor": true,
  "showGrain": true,
  "ctaStyle": "split"
}/*EDITMODE-END*/;

function App() {
  const [page, setPage] = React.useState('landing');
  const [prevPage, setPrevPage] = React.useState(null);
  const [detailProperty, setDetailProperty] = React.useState(null);
  const [authMode, setAuthMode] = React.useState(null); // 'login' | 'signup' | null
  const [user, setUser] = React.useState(null);
  const [revealing, setRevealing] = React.useState(false); // post-auth curtain reveal
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply tweaks live via CSS vars
  React.useEffect(() => {
    document.documentElement.style.setProperty('--gold', t.accent);
    const lighter = t.accent === '#B8922A' ? '#d4a843'
      : t.accent === '#7BA88F' ? '#a3d4be'
      : t.accent === '#C76A5A' ? '#e89887'
      : t.accent === '#FFFFFF' ? '#dddddd'
      : t.accent;
    document.documentElement.style.setProperty('--gold-light', lighter);
    document.documentElement.style.setProperty('--font-serif', `'${t.displayFont}', Georgia, serif`);
  }, [t.accent, t.displayFont]);

  function navigate(target) {
    setPrevPage(page);
    setPage(target);
  }

  const openDetail = (p) => { setDetailProperty(p); navigate('detail'); };
  const openAuth = (mode) => { setAuthMode(mode); };
  const handleAuthSuccess = (u) => {
    setUser(u);
    setAuthMode(null);
    setRevealing(true);
    navigate('dashboard');
    // Lift the curtain
    setTimeout(() => setRevealing(false), 1400);
  };

  // Scroll to top on page change
  React.useEffect(() => { window.scrollTo(0, 0); }, [page, authMode]);

  // Don't show nav on dashboard or auth
  const showNav = page !== 'dashboard' && !authMode;

  const backTarget = {
    detail: 'listing',
    listing: 'landing',
    dashboard: 'landing'
  }[page];
  const showBack = page !== 'landing' && !authMode;
  const onBack = showBack ? () => navigate(backTarget) : null;

  // Page transition class — detail gets a richer rise
  const transitionClass = page === 'detail' ? 'page-rise' : 'page-fade';

  return (
    <div className="app-shell" data-screen-label={`0${['landing','listing','detail','dashboard'].indexOf(page) + 1} ${page}`}>
      {t.showGrain && <div className="grain" />}

      {showNav && <Nav page={page} setPage={navigate} solid={page !== 'landing'} onBack={onBack} user={user} onAuth={openAuth} onLogout={() => setUser(null)} />}

      {/* Auth overlay */}
      {authMode && (
        <Auth
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setAuthMode(null)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Page content with transition */}
      {!authMode && (
        <div className={`page-wrap ${transitionClass}`} key={page}>
          {page === 'landing' && <Landing setPage={navigate} openAuth={openAuth} />}
          {page === 'listing' && <Listing setPage={navigate} openDetail={openDetail} />}
          {page === 'detail' && <Detail property={detailProperty} setPage={navigate} />}
          {page === 'dashboard' && <Dashboard user={user} onBack={onBack} />}
        </div>
      )}

      {/* Post-auth curtain reveal */}
      {revealing && (
        <div className="auth-curtain">
          <div className="curtain-top" />
          <div className="curtain-bottom" />
          <div className="curtain-center">
            <div className="curtain-logo">
              <span>Inmobiliaria</span><span style={{ color: 'var(--gold)' }}>PY</span><span className="logo-dot" />
            </div>
            <div className="curtain-line" />
            <div className="curtain-greet">
              {user && <>Hola, <span className="italic-accent">{user.name.split(' ')[0]}</span></>}
            </div>
          </div>
        </div>
      )}

      <PageSwitcher page={page} setPage={navigate} />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Brand">
          <TweakColor
            label="Accent"
            value={t.accent}
            options={['#7BA88F', '#B8922A', '#C76A5A', '#5b7ca8']}
            onChange={v => setTweak('accent', v)}
          />
          <TweakSelect
            label="Display font"
            value={t.displayFont}
            options={[
              { value: 'Playfair Display', label: 'Playfair Display' },
              { value: 'Noto Serif', label: 'Noto Serif' },
              { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
              { value: 'DM Serif Display', label: 'DM Serif Display' }
            ]}
            onChange={v => setTweak('displayFont', v)}
          />
        </TweakSection>
        <TweakSection title="Effects">
          <TweakToggle label="Grain overlay" value={t.showGrain} onChange={v => setTweak('showGrain', v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
