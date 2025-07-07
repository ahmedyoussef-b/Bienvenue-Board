// src/app/api/auth/social-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import type { SafeUser, Role as AppRole } from '@/types/index';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const EFFECTIVE_JWT_EXPIRATION_TIME = process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || '1h';

export async function POST(req: NextRequest) {
  console.log("➡️ [API] POST /api/auth/social-login: Request received.");
  if (!JWT_SECRET_KEY) {
    console.error("❌ [API] Social login failed: JWT_SECRET_KEY is not defined.");
    return NextResponse.json({ message: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const { email, name, imgUrl, role } = await req.json() as { email: string; name: string; imgUrl: string | null; role: AppRole | null };
    console.log(`[API] Attempting social login for email: ${email}, role: ${role}`);

    if (!email || !name) {
      console.warn('[API] Social login failed: Email and name are required.');
      return NextResponse.json({ message: 'Email et nom sont requis' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      console.log(`[API] Existing user found for social login: ${user.username}.`);
      // User exists, update their info if necessary
      const dataToUpdate: { name?: string; img?: string | null } = {};
      if (user.name !== name) dataToUpdate.name = name;
      if (user.img !== imgUrl) dataToUpdate.img = imgUrl;

      if (Object.keys(dataToUpdate).length > 0) {
        console.log("[API] Updating user profile with new social info.");
        user = await prisma.user.update({
          where: { email },
          data: dataToUpdate,
        });
      }
    } else {
      console.log(`[API] New user registration via social login for email: ${email}.`);
      // New user registration
      if (!role) {
        console.warn("[API] Social login failed: New user requires a role.");
        return NextResponse.json({ message: 'Veuillez vous inscrire en choisissant un rôle avant de vous connecter.' }, { status: 400 });
      }

      if (role !== Role.TEACHER && role !== Role.PARENT) {
        console.warn(`[API] Social login failed: Invalid role for new user: ${role}.`);
        return NextResponse.json({ message: 'Le rôle spécifié est invalide pour une nouvelle inscription.' }, { status: 400 });
      }
      
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || 'Utilisateur';
      
      console.log("[API] Starting transaction to create new social user and profile.");
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            username: email, // Use email as unique username for social logins
            name,
            img: imgUrl,
            role,
            active: true,
          },
        });
        console.log(`[API] ✅ New user created in DB with ID: ${newUser.id}`);

        if (role === Role.TEACHER) {
          await tx.teacher.create({ data: { userId: newUser.id, name: firstName, surname: lastName } });
          console.log(`[API] ✅ Teacher profile created for new social user.`);
        } else if (role === Role.PARENT) {
          await tx.parent.create({ data: { userId: newUser.id, name: firstName, surname: lastName } });
           console.log(`[API] ✅ Parent profile created for new social user.`);
        }

        return newUser;
      });
       console.log("[API] Transaction successful for social user creation.");
    }

    console.log(`[API] ✅ Generating session token for social login user: ${user.username}`);
    const tokenPayload = { userId: user.id, role: user.role, email: user.email, name: user.name };
    const token = jwt.sign(tokenPayload, JWT_SECRET_KEY, { expiresIn: EFFECTIVE_JWT_EXPIRATION_TIME });

    const safeUserResponse: SafeUser = { ...user, name: user.name || user.email };
    
    const response = NextResponse.json({ message: 'Connexion réussie', user: safeUserResponse }, { status: 200 });
    
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'none',
    });
     console.log(`[API] 🍪 Session cookie set for social user ${user.username}.`);

    return response;

  } catch (error) {
    console.error("[API] ❌ Unexpected error during social login:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
