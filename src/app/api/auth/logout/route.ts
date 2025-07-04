
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'appSessionToken';

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });

    response.cookies.set(SESSION_COOKIE_NAME, '', {
      maxAge: -1,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[LOGOUT_API_ERROR]', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
