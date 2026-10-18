export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Cargando"
      style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <style>{`@keyframes impy-pulse{0%,100%{opacity:.25}50%{opacity:1}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, letterSpacing: '-0.01em' }}>
          Inmobiliaria<span style={{ color: 'var(--gold)' }}>PY</span>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: `impy-pulse 1.2s ${i * 0.2}s infinite ease-in-out` }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
