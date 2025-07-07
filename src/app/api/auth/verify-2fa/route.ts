// src/app/api/auth/verify-2fa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from "@/lib/prisma";
import { SafeUser, Role as AppRole } from '@/types/index';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const JWT_ACCESS_TOKEN_EXPIRATION_TIME = process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || '1h';

export async function POST(req: NextRequest) {
  if (!JWT_SECRET_KEY) {
    console.error('2FA Verification failed: JWT_SECRET_KEY is not defined.');
    return NextResponse.json({ message: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const { token: twoFactorToken, code } = await req.json();

    if (!twoFactorToken || !code) {
      return NextResponse.json({ message: 'Token and code are required' }, { status: 400 });
    }

    // 1. Verify the temporary 2FA token
    let decoded: { userId: string, twoFactorCodeHash: string };
    try {
      decoded = jwt.verify(twoFactorToken, JWT_SECRET_KEY) as typeof decoded;
    } catch (error) {
      return NextResponse.json({ message: 'Invalid or expired verification token.' }, { status: 401 });
    }

    // 2. Compare the submitted code with the hashed code in the token
    const codeMatch = await bcrypt.compare(code, decoded.twoFactorCodeHash);
    if (!codeMatch) {
      return NextResponse.json({ message: 'Invalid verification code.' }, { status: 401 });
    }

    // 3. If code is correct, fetch the user and generate the final session token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    // 4. Generate and return final session token and user data
    const finalName = user.name || user.username || user.email;
    const userRole = user.role as AppRole;
    
    const tokenPayload = { userId: user.id, role: userRole, email: user.email, name: finalName };
    const token = jwt.sign(tokenPayload, JWT_SECRET_KEY, { expiresIn: JWT_ACCESS_TOKEN_EXPIRATION_TIME });

    const { password: _, ...userScalars } = user;
    const safeUserResponse: SafeUser = { ...userScalars, name: finalName, role: userRole };
    
    const response = NextResponse.json({ token, user: safeUserResponse }, { status: 200 });
    
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'lax',
    });

    return response;

  } catch (error) {
    console.error('Unexpected error during 2FA verification:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
