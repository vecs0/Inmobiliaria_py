'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const schema = z
  .object({
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] });

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  // El link del email trae ?code= (PKCE). Lo canjeamos por sesión si hace falta.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (!cancelled) setReady('ok');
        return;
      }
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) setReady(exErr ? 'invalid' : 'ok');
        return;
      }
      if (!cancelled) setReady('invalid');
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady('ok');
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos');
      return;
    }
    setStatus('saving');
    const { error: upErr } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (upErr) {
      setStatus('idle');
      setError(upErr.message);
      return;
    }
    setStatus('done');
    setTimeout(() => {
      router.push('/auth/login');
      router.refresh();
    }, 1800);
  }

  return (
    <div className="auth-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
      <div className="glass-card" style={{ background: 'var(--bg-mid)', padding: 40, borderRadius: 16, maxWidth: 420, width: '100%' }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>NUEVA CONTRASEÑA</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, marginBottom: 12 }}>
          Elegí una <span style={{ fontStyle: 'italic', color: 'var(--gold)' }}>contraseña nueva.</span>
        </h1>

        {ready === 'checking' && <p style={{ color: 'var(--gray)' }}>Verificando enlace…</p>}

        {ready === 'invalid' && (
          <p role="alert" style={{ color: 'var(--gray)', lineHeight: 1.6 }}>
            El enlace expiró o no es válido.{' '}
            <Link href="/auth/reset-password" style={{ color: 'var(--gold)' }}>
              Pedí uno nuevo →
            </Link>
          </p>
        )}

        {ready === 'ok' && status === 'done' && (
          <p role="status" style={{ color: 'var(--gold-light)' }}>
            ¡Listo! Actualizamos tu contraseña. Te llevamos al login…
          </p>
        )}

        {ready === 'ok' && status !== 'done' && (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="new-password"><span>Contraseña nueva</span></label>
              <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
            </div>
            <div className="auth-field">
              <label htmlFor="confirm-password"><span>Repetir contraseña</span></label>
              <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button type="submit" className="auth-submit" style={{ marginTop: 16 }} disabled={status === 'saving'}>
              <span className="as-label">{status === 'saving' ? 'Guardando' : 'Guardar contraseña'}</span>
              <span className="as-arrow">→</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
