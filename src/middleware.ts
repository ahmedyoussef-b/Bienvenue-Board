import { NextResponse, type NextRequest } from 'next/server';

const defaultLocale = 'fr';

// Regex pour détecter les fichiers publics (ex: favicon.ico, logo.png)
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore les routes API, les fichiers statiques Next.js, et les fichiers publics.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    PUBLIC_FILE.test(pathname)
  ) {
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
  return NextResponse.rewrite(url);
}

// Le matcher est retiré pour laisser la logique du dessus s'exécuter sur toutes les requêtes.
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
