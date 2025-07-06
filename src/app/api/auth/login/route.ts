// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SafeUser, Role as AppRole } from '@/types/index';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const JWT_ACCESS_TOKEN_EXPIRATION_TIME = process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || '1h';
const JWT_2FA_TOKEN_EXPIRATION_TIME = '5m';

export const POST = async (req: NextRequest) => {
  if (!JWT_SECRET_KEY) {
    console.error('Login failed: JWT_SECRET_KEY is not defined.');
    return NextResponse.json({ message: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // --- 2FA Logic for Admins ---
    if (user.role === AppRole.ADMIN) {
      const twoFactorCode = crypto.randomInt(100000, 1000000).toString();
      const twoFactorCodeHashed = await bcrypt.hash(twoFactorCode, 10);

      const twoFactorToken = jwt.sign(
        { userId: user.id, twoFactorCodeHash: twoFactorCodeHashed },
        JWT_SECRET_KEY,
        { expiresIn: JWT_2FA_TOKEN_EXPIRATION_TIME }
      );

      // Send email using nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Votre code de connexion SchooLama',
        html: `<p>Votre code de vérification est : <strong>${twoFactorCode}</strong></p><p>Il expirera dans 5 minutes.</p>`,
      });

      return NextResponse.json({
        twoFactorRequired: true,
        twoFactorToken: twoFactorToken,
      }, { status: 200 });
    }

    // --- Standard Login for other roles ---
    const finalName = user.name || user.username || user.email;
    const userRole = user.role as AppRole;
    
    const tokenPayload = { userId: user.id, role: userRole, email: user.email, name: finalName };
    const token = jwt.sign(tokenPayload, JWT_SECRET_KEY, { expiresIn: JWT_ACCESS_TOKEN_EXPIRATION_TIME });

    const { password: _, ...userScalars } = user;
    const safeUserResponse: SafeUser = { ...userScalars, name: finalName, role: userRole };
    
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
    console.error('Unexpected error during login:', error);
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred during login' }, { status: 500 });
  }
};
