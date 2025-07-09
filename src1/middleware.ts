import { NextResponse, type NextRequest } from 'next/server';

const defaultLocale = 'fr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifie si le chemin contient déjà la locale
  const pathnameHasLocale = pathname.startsWith(`/${defaultLocale}/`) || pathname === `/${defaultLocale}`;

  if (pathnameHasLocale) {
    return NextResponse.next(); // Continue sans modification
  }

  // Réécrit l'URL pour inclure la locale par défaut
  const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
  return NextResponse.rewrite(newUrl);
}

export const config = {
  matcher: [
    '/((?!api|_next|.*\\..*).*)',
  ],
};
