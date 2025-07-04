import { NextResponse, type NextRequest } from 'next/server';

const defaultLocale = 'fr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Explicitly ignore all API routes.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2. Ignore Next.js internal paths and public files with extensions.
  if (
    pathname.startsWith('/_next/') ||
    pathname.includes('.') // Catches files like favicon.ico, robots.txt, image.png
  ) {
    return NextResponse.next();
  }

  // 3. Check if the path already has the locale.
  const pathnameHasLocale =
    pathname.startsWith(`/${defaultLocale}/`) || pathname === `/${defaultLocale}`;

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // 4. If none of the above, rewrite the path to include the default locale.
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Match on all paths and let the function above do the filtering.
  // This is a more reliable approach than complex negative lookaheads in the matcher.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};