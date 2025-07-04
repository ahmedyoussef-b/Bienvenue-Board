import { NextResponse, type NextRequest } from 'next/server';

const defaultLocale = 'fr';
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`--- 3. 🚦 Middleware: Intercepted path: ${pathname} ---`);

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    PUBLIC_FILE.test(pathname)
  ) {
    console.log(`--- 3a. ✅ Middleware: Ignoring path, passing through: ${pathname} ---`);
    return NextResponse.next();
  }

  if (
    pathname.startsWith(`/${defaultLocale}/`) ||
    pathname === `/${defaultLocale}`
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  console.log(`--- 3b. 🔄 Middleware: Rewriting path to: ${url.pathname} ---`);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
