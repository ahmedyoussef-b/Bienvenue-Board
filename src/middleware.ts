import { NextResponse, type NextRequest } from 'next/server';

const defaultLocale = 'fr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths to ignore for localization
  const ignoredPrefixes = ['/api/', '/_next/', '/static/'];
  const publicFileRegex = /\.(.*)$/;

  if (
    ignoredPrefixes.some(prefix => pathname.startsWith(prefix)) ||
    publicFileRegex.test(pathname)
  ) {
    return NextResponse.next(); // Pass through without rewriting
  }

  // Check if locale is already present
  if (
    pathname.startsWith(`/${defaultLocale}/`) ||
    pathname === `/${defaultLocale}`
  ) {
    return NextResponse.next();
  }

  // Rewrite the URL to include the default locale
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(url);
}

// By not exporting a config object, this middleware applies to all paths.
// The logic inside handles which paths to ignore.
