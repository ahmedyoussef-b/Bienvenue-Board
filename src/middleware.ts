import { NextResponse, type NextRequest } from 'next/server';

const defaultLocale = 'fr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The middleware matcher below now excludes /api/ routes,
  // so we don't need to check for them here anymore.

  const pathnameHasLocale = pathname.startsWith(`/${defaultLocale}/`) || pathname === `/${defaultLocale}`;

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Rewrite the URL to include the default locale
  const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
  return NextResponse.rewrite(newUrl);
}

export const config = {
  // Update the matcher to exclude /api/ routes from being processed by the middleware.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
