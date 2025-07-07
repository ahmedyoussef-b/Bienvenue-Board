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
  console.log("➡️ [API] POST /api/auth/verify-2fa: Request received.");
  if (!JWT_SECRET_KEY) {
    console.error('❌ [API] 2FA Verification failed: JWT_SECRET_KEY is not defined.');
    return NextResponse.json({ message: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const { token: twoFactorToken, code } = await req.json();
    console.log("[API] Attempting to verify 2FA code.");

    if (!twoFactorToken || !code) {
      console.warn('[API] 2FA verification failed: Token or code missing.');
      return NextResponse.json({ message: 'Token and code are required' }, { status: 400 });
    }

    // 1. Verify the temporary 2FA token
    let decoded: { userId: string, twoFactorCodeHash: string };
    try {
      decoded = jwt.verify(twoFactorToken, JWT_SECRET_KEY) as typeof decoded;
      console.log(`[API] ✅ Temporary 2FA token is valid for userId: ${decoded.userId}`);
    } catch (error) {
       console.warn("[API] ❌ Temporary 2FA token is invalid or expired.", error);
      return NextResponse.json({ message: 'Invalid or expired verification token.' }, { status: 401 });
    }

    // 2. Compare the submitted code with the hashed code in the token
    console.log("[API] Comparing submitted code with hashed code...");
    const codeMatch = await bcrypt.compare(code, decoded.twoFactorCodeHash);
    if (!codeMatch) {
       console.warn("[API] ❌ 2FA code does not match.");
      return NextResponse.json({ message: 'Invalid verification code.' }, { status: 401 });
    }
    console.log("[API] ✅ 2FA code match successful.");

    // 3. If code is correct, fetch the user and generate the final session token
    console.log(`[API] Fetching user from DB for final session token generation (ID: ${decoded.userId}).`);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      console.error(`[API] ❌ Critical error: User from valid 2FA token not found in DB (ID: ${decoded.userId}).`);
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }
    console.log(`[API] ✅ User found. Generating final session token.`);

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
      sameSite: 'none',
    });
     console.log(`[API] 🍪 Final session cookie set for ${user.username}.`);

    return response;

  } catch (error) {
    console.error('❌ [API] Unexpected error during 2FA verification:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
