import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeRedirect } from '@/app/auth/safe-redirect';

/**
 * Callback de Supabase Auth (confirmación de email, magic link, OAuth).
 * GET /auth/callback?code=...&next=/vendedor → canjea el code por sesión (cookies) y redirige.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeRedirect(url.searchParams.get('next')) ?? '/';
  const errorDescription = url.searchParams.get('error_description');

  if (errorDescription) {
    const login = new URL('/auth/login', url.origin);
    login.searchParams.set('error', errorDescription);
    return NextResponse.redirect(login);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    console.error('[auth/callback] exchangeCodeForSession:', error.message);
  }

  const login = new URL('/auth/login', url.origin);
  login.searchParams.set('redirect', next);
  return NextResponse.redirect(login);
}
