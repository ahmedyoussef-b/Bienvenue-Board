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
  if (!JWT_SECRET_KEY) {
    return NextResponse.json({ message: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ message: 'No active session token found' }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
    } catch (error: any) {
      const clearResponse = NextResponse.json({ message: 'Invalid or expired session token' }, { status: 401 });
      clearResponse.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return clearResponse;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      const clearResponse = NextResponse.json({ message: 'Session user not found' }, { status: 401 });
      clearResponse.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return clearResponse;
    }
    
    const finalName = user.name || user.username || user.email;

    const { password: _, ...userScalars } = user;

    const safeUser: SafeUser = {
      ...userScalars,
      name: finalName,
      role: user.role as AppRole,
    };
    
    return NextResponse.json({ user: safeUser }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error during session check' }, { status: 500 });
  }
}
