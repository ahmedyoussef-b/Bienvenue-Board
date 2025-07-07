// src/app/api/auth/session/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import type { Role as AppRole, SafeUser, JwtPayload as AppJwtPayload } from "@/types/index";
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export async function GET(req: NextRequest) {
  console.log("➡️ [API] GET /api/auth/session: Session check request received.");
  if (!JWT_SECRET_KEY) {
    console.error("❌ [API] Session check failed: JWT_SECRET_KEY is not defined.");
    return NextResponse.json({ message: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      console.log("[API] ❌ No active session token found in cookies.");
      return NextResponse.json({ message: 'No active session token found' }, { status: 401 });
    }
    console.log("[API] ✅ Session token found. Verifying...");

    let decoded: AppJwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET_KEY) as AppJwtPayload;
    } catch (error: any) {
      console.warn("[API] ❌ Token verification failed. Invalid or expired token.", error.message);
      const clearResponse = NextResponse.json({ message: 'Invalid or expired session token' }, { status: 401 });
      clearResponse.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return clearResponse;
    }
    console.log(`[API] ✅ Token verified successfully for userId: ${decoded.userId}`);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      console.warn(`[API] ❌ User from token (ID: ${decoded.userId}) not found in database.`);
      const clearResponse = NextResponse.json({ message: 'Session user not found' }, { status: 401 });
      clearResponse.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return clearResponse;
    }
    console.log(`[API] ✅ User found in database. Responding with user data.`);
    
    const finalName = user.name || user.username || user.email;

    const { password: _, ...userScalars } = user;

    const safeUser: SafeUser = {
      ...userScalars,
      name: finalName,
      role: user.role as AppRole,
    };
    
    return NextResponse.json({ user: safeUser }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [API] Internal server error during session check:", error);
    return NextResponse.json({ message: 'Internal server error during session check' }, { status: 500 });
  }
}
