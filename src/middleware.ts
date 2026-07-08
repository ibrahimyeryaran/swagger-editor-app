import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';

const handleI18nRouting = createIntlMiddleware(routing);

const PRIVATE_PATHS = ['/history'];
const AUTH_PATHS = ['/signin', '/signup'];

function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|tr)(\/.*)?$/);
  if (match) {
    return match[2] ?? '/';
  }
  return pathname;
}

export async function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the token against Supabase, so expired or
  // tampered sessions are treated as unauthenticated.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const path = stripLocale(pathname);
  const isPrivate = PRIVATE_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  const isAuthRoute = AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if ((isPrivate && !user) || (isAuthRoute && user)) {
    // Preserve the locale prefix when sending the user back to the main page.
    const localeMatch = pathname.match(/^\/(en|tr)(\/|$)/);
    const mainPage = localeMatch ? `/${localeMatch[1]}` : '/';
    return NextResponse.redirect(new URL(mainPage, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
