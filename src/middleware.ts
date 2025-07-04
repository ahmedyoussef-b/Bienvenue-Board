import { NextResponse, type NextRequest } from 'next/server';

const defaultLocale = 'fr';
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Explicitly skip API routes, Next.js internal routes, and public files.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

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
  // A simpler matcher that covers all paths except the ones explicitly skipped above.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
