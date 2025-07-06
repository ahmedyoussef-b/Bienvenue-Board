// src/app/api/auth/session/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import type { Role as AppRole, SafeUser, JwtPayload } from "@/types/index";
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export async function GET(req: NextRequest) {
  console.log("➡️ [API] GET /api/auth/session: Session check request received.");

  if (!JWT_SECRET_KEY) {
    console.error('❌ [API] Session check failed: JWT_SECRET_KEY is not defined.');
    return NextResponse.json({ message: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      console.log("[API] No active session token found in cookies.");
      return NextResponse.json({ message: 'No active session token found' }, { status: 401 });
    }
    console.log("[API] Session token found in cookies.");


    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
      console.log(`[API] Token decoded successfully. Payload:`, decoded);
    } catch (error: any) {
      console.error('❌ [API] Session check failed: JWT verification error.', error.message);
      const clearResponse = NextResponse.json({ message: 'Invalid or expired session token' }, { status: 401 });
      clearResponse.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return clearResponse;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      console.error(`❌ [API] User from token not found in DB. UserID: ${decoded.userId}`);
      const clearResponse = NextResponse.json({ message: 'Session user not found' }, { status: 401 });
      clearResponse.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return clearResponse;
    }
    console.log(`[API] User found in DB from token payload. ID: ${user.id}`);
    
    const finalName = user.name || user.username || user.email;

    const { password: _, ...userScalars } = user;

    const safeUser: SafeUser = {
      ...userScalars,
      name: finalName,
      role: user.role as AppRole,
    };
    
    console.log(`[API] Returning user data for session check:`, safeUser);
    return NextResponse.json({ user: safeUser }, { status: 200 });

  } catch (error: any) {
    console.error(`❌ [API] Unexpected error during session check:`, error);
    return NextResponse.json({ message: 'Internal server error during session check' }, { status: 500 });
  }
}
