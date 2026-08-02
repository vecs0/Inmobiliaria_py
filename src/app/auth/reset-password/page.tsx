import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="auth-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-mid)', padding: '40px', borderRadius: '16px', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-main)' }}>Recuperar Contraseña</h1>
        <p style={{ color: 'var(--gray)', marginBottom: '24px' }}>Ingresá tu correo electrónico para enviarte un enlace de recuperación.</p>
        <form className="auth-form" action="/api/auth/reset" method="POST">
          <div className="auth-field">
            <label><span>Correo electrónico</span></label>
            <input type="email" name="email" placeholder="vos@ejemplo.com.py" required />
          </div>
          <button type="submit" className="auth-submit" style={{ marginTop: '16px' }}>
            <span className="as-label">Enviar enlace</span>
            <span className="as-arrow">→</span>
          </button>
        </form>
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link href="/auth/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Volver al login</Link>
        </div>
      </div>
    </div>
  );
}
