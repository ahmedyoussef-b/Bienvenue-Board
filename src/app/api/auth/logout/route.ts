import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

export async function POST(req: NextRequest) {
  console.log("➡️ [API] POST /api/auth/logout: Logout request received.");
  try {
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: true,
      maxAge: -1,
      path: '/',
      sameSite: 'none',
    });
    console.log("[API] 🍪 Cleared session cookie.");
    return response;
  } catch (error) {
    console.error("[API] ❌ Error during logout:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
