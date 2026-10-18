'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const emailSchema = z.email({ message: 'Ingresá un email válido' });

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Email inválido');
      return;
    }
    setStatus('sending');
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (err) {
      setStatus('error');
      setError(err.message);
      return;
    }
    setStatus('sent');
  }

  return (
    <div className="auth-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
      <div className="glass-card" style={{ background: 'var(--bg-mid)', padding: 40, borderRadius: 16, maxWidth: 420, width: '100%' }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>RECUPERAR ACCESO</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, marginBottom: 12 }}>
          Recuperar <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>contraseña.</span>
        </h1>

        {status === 'sent' ? (
          <p role="status" style={{ color: 'var(--gray)', lineHeight: 1.6 }}>
            Si existe una cuenta con <strong style={{ color: 'var(--white)' }}>{email}</strong>, te enviamos un enlace para crear una
            nueva contraseña. Revisá tu bandeja de entrada (y el spam).
          </p>
        ) : (
          <>
            <p style={{ color: 'var(--gray)', marginBottom: 24 }}>Ingresá tu correo y te enviamos un enlace de recuperación.</p>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="reset-email"><span>Correo electrónico</span></label>
                <input id="reset-email" type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@ejemplo.com.py" required />
              </div>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button type="submit" className="auth-submit" style={{ marginTop: 16 }} disabled={status === 'sending'}>
                <span className="as-label">{status === 'sending' ? 'Enviando' : 'Enviar enlace'}</span>
                <span className="as-arrow">→</span>
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href="/auth/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
