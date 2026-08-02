import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

async function resolveHomePath(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string> {
  const [{ data: profile }, { data: seller }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userId).maybeSingle(),
    supabase.from('seller_profiles').select('seller_type').eq('user_id', userId).maybeSingle(),
  ]);
  if (profile?.role === 'admin' || profile?.role === 'agent') return '/vendedor';
  if (seller) return '/vendedor';
  return '/comprador';
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isSellerRoute = pathname.startsWith('/vendedor');
  const isBuyerRoute = pathname.startsWith('/comprador');

  if (isBuyerRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  const isAuthRoute =
    pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');

  if (isSellerRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (user && (isSellerRoute || isBuyerRoute || isAuthRoute)) {
    const { data: seller } = await supabase
      .from('seller_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (isSellerRoute && !seller) {
      const url = request.nextUrl.clone();
      url.pathname = '/comprador';
      return NextResponse.redirect(url);
    }

    if (isBuyerRoute && seller) {
      const url = request.nextUrl.clone();
      url.pathname = '/vendedor';
      return NextResponse.redirect(url);
    }

    if (isAuthRoute) {
      const home = await resolveHomePath(supabase, user.id);
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
