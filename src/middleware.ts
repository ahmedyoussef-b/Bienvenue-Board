import { NextResponse, type NextRequest } from 'next/server';

const defaultLocale = 'fr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale =
    pathname.startsWith(`/${defaultLocale}/`) || pathname === `/${defaultLocale}`;

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Rewrite the URL to include the default locale
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(request.nextUrl);
}

export const config = {
  // Updated matcher to explicitly exclude /api routes and other assets.
  // This prevents the middleware from rewriting API call paths.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};