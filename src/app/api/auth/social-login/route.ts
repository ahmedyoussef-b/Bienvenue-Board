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
  if (!JWT_SECRET_KEY) {
    return NextResponse.json({ message: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const { email, name, imgUrl, role } = await req.json() as { email: string; name: string; imgUrl: string | null; role: AppRole | null };

    if (!email || !name) {
      return NextResponse.json({ message: 'Email et nom sont requis' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists, update their info if necessary
      const dataToUpdate: { name?: string; img?: string | null } = {};
      if (user.name !== name) dataToUpdate.name = name;
      if (user.img !== imgUrl) dataToUpdate.img = imgUrl;

      if (Object.keys(dataToUpdate).length > 0) {
        user = await prisma.user.update({
          where: { email },
          data: dataToUpdate,
        });
      }
    } else {
      // New user registration
      if (!role) {
        return NextResponse.json({ message: 'Veuillez vous inscrire en choisissant un rôle avant de vous connecter.' }, { status: 400 });
      }

      if (role !== Role.TEACHER && role !== Role.PARENT) {
        return NextResponse.json({ message: 'Le rôle spécifié est invalide pour une nouvelle inscription.' }, { status: 400 });
      }
      
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ') || 'Utilisateur';

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

        if (role === Role.TEACHER) {
          await tx.teacher.create({ data: { userId: newUser.id, name: firstName, surname: lastName } });
        } else if (role === Role.PARENT) {
          await tx.parent.create({ data: { userId: newUser.id, name: firstName, surname: lastName } });
        }

        return newUser;
      });
    }

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
      sameSite: 'lax',
    });

    return response;

  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
