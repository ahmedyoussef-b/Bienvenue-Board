import { NextResponse, type NextRequest } from 'next/server';

const defaultLocale = 'fr';

// Regex pour détecter les fichiers publics (ex: favicon.ico, logo.png)
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`--- 3. Middleware: Intercepted request for path: ${pathname} ---`);

  // Ignore routes for API, Next.js internal files, and public assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    PUBLIC_FILE.test(pathname)
  ) {
    console.log(`--- 3a. Middleware: Skipping rewrite for path: ${pathname} ---`);
    return NextResponse.next();
  }

  // Si la locale est déjà présente, ne rien faire.
  if (
    pathname.startsWith(`/${defaultLocale}/`) ||
    pathname === `/${defaultLocale}`
  ) {
    return NextResponse.next();
  }

  // Sinon, réécrire l'URL pour inclure la locale par défaut.
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  console.log(`--- 3b. Middleware: Rewriting path to: ${url.pathname} ---`);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
