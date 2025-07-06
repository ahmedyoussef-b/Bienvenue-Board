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
  console.log("➡️ [API] POST /api/auth/login: Request received.");

  if (!JWT_SECRET_KEY) {
    console.error('❌ [API] Login failed: JWT_SECRET_KEY is not defined.');
    return NextResponse.json({ message: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { email, password } = body;
    console.log(`[API] Attempting login for email: ${email}`);

    if (!email || !password) {
      console.log("[API] Login failed: Email or password not provided.");
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      console.log(`[API] Login failed: User not found or no password set for ${email}.`);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    console.log(`[API] User found in DB: ${user.id}`);


    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log(`[API] Login failed: Invalid password for user ${email}.`);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    console.log(`[API] Password match successful for user ${email}.`);


    // --- 2FA Logic for Admins ---
    if (user.role === AppRole.ADMIN) {
      console.log(`[API] Admin user detected (${email}). Initiating 2FA flow.`);
      const twoFactorCode = crypto.randomInt(100000, 1000000).toString();
      const twoFactorCodeHashed = await bcrypt.hash(twoFactorCode, 10);

      const twoFactorToken = jwt.sign(
        { userId: user.id, twoFactorCodeHash: twoFactorCodeHashed },
        JWT_SECRET_KEY,
        { expiresIn: JWT_2FA_TOKEN_EXPIRATION_TIME }
      );
      console.log(`[API] Generated 2FA token for admin ${email}.`);


      try {
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
          console.log(`[API] 2FA email sent successfully to ${email}.`);
      } catch(emailError) {
          console.error('*************************************************************************************');
          console.error('** ❌ [API] Échec de l\'envoi de l\'e-mail 2FA. Vérifiez la configuration SMTP dans .env. **');
          console.error(`** 🔑 [API] Code de secours pour ${user.email}: ${twoFactorCode} **`);
          console.error('*************************************************************************************');
      }
      
      console.log(`[API] Returning 2FA required response to client.`);
      return NextResponse.json({
        twoFactorRequired: true,
        twoFactorToken: twoFactorToken,
      }, { status: 200 });
    }

    // --- Standard Login for other roles ---
    console.log(`[API] Standard login for user ${email}. Generating session token.`);
    const finalName = user.name || user.username || user.email;
    const userRole = user.role as AppRole;
    
    const tokenPayload = { userId: user.id, role: userRole, email: user.email, name: finalName };
    const token = jwt.sign(tokenPayload, JWT_SECRET_KEY, { expiresIn: JWT_ACCESS_TOKEN_EXPIRATION_TIME });
    console.log(`[API] Session token generated for ${email}.`);

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
    console.log(`[API] Session cookie set for ${email}. Login complete.`);
    return response;

  } catch (error) {
    console.error('❌ [API] Unexpected error during login:', error);
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred during login' }, { status: 500 });
  }
};
