// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SafeUser, Role as AppRole } from '@/types/index'; 

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const jwtExpirationEnv = process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME;
const EFFECTIVE_JWT_EXPIRATION_TIME = (jwtExpirationEnv && jwtExpirationEnv.trim() !== '') ? jwtExpirationEnv : '1h';
const SESSION_COOKIE_NAME = 'appSessionToken';

export const POST = async (req: NextRequest) => {
  console.log("--- 4. 🚪 API Route: /api/auth/login reached ---");
  if (!JWT_SECRET_KEY) {
    console.error('API Login: JWT_SECRET_KEY is not defined.');
    return NextResponse.json({ message: 'Internal configuration error: Missing JWT secret.' }, { status: 500 });
  }

  const body = await req.json();
  const { email, password } = body;
  console.log("--- 4a. ✉️ API Route: Received body ---", { email });


  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`--- 4b. ❌ API Route: User not found for email: ${email} ---`);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (!user.password) {
        return NextResponse.json({ message: 'Invalid user record (missing password)' }, { status: 401 });
    }
    
    console.log("--- 4c. 🔑 API Route: Comparing passwords... ---");
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log("--- 4d. ❌ API Route: Password mismatch. ---");
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    console.log("--- 4e. ✅ API Route: Password match! Creating token... ---");
    const finalName = user.name || user.username || user.email;
    const userRole = user.role as AppRole;
    
    const tokenPayload = {
        userId: user.id,
        role: userRole,
        email: user.email,
        name: finalName,
    };

    const secretKey: Secret = JWT_SECRET_KEY;
    const signOptions: SignOptions = {
        expiresIn: EFFECTIVE_JWT_EXPIRATION_TIME 
    };

    const token = jwt.sign(tokenPayload, secretKey, signOptions);
    
    const { password: _, ...userScalars } = user;

    const safeUserResponse: SafeUser = {
      ...userScalars,
      name: finalName,
      role: userRole,
    };
    
    console.log("--- 4f. 🎉 API Route: Login successful, sending response. ---");
    const response = NextResponse.json({ token, user: safeUserResponse }, { status: 200 });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'lax',
    });

    return response;

  } catch (error) {
    console.error('Login API Error:', error);
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred during login' }, { status: 500 });
  }
};
