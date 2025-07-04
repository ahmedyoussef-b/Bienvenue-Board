import { NextResponse, type NextRequest } from 'next/server';

// The default and only locale is 'fr'
const defaultLocale = 'fr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Explicitly ignore any path that starts with /api/
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2. Check if the default locale is already in the pathname
  if (
    pathname.startsWith(`/${defaultLocale}/`) ||
    pathname === `/${defaultLocale}`
  ) {
    return NextResponse.next();
  }

  // 3. If not, rewrite the URL to include the default locale
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  /*
   * This matcher will run the middleware on all paths except for:
   * - internal Next.js files (_next/static, _next/image)
   * - favicon.ico
   * The logic inside the middleware function then handles ignoring /api/ routes.
   * This separation of concerns is more robust.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};