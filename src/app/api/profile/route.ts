// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { z } from 'zod';
import { profileUpdateSchema } from '@/lib/formValidationSchemas';
import { SafeUser } from '@/types';
import jwt from 'jsonwebtoken';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const JWT_ACCESS_TOKEN_EXPIRATION_TIME = process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || '1h';

export async function PUT(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.userId || !session.role) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
  }
  
  if (!JWT_SECRET_KEY) {
      console.error("❌ [API/profile] JWT_SECRET_KEY is not defined.");
      return NextResponse.json({ message: "Erreur de configuration du serveur." }, { status: 500 });
  }

  try {
    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!currentUser) {
      return NextResponse.json({ message: "Utilisateur de la session non trouvé." }, { status: 404 });
    }

    const body = await request.json();
    const validation = profileUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Données invalides', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, surname, username, email, password, phone, address, img } = validation.data;

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update User model
      const userData: Prisma.UserUpdateInput = {};
      
      if (email && email !== currentUser.email) {
        const existing = await tx.user.findUnique({ where: { email } });
        if (existing) throw new Error("Cet e-mail est déjà utilisé par un autre compte.");
        userData.email = email;
      }

      if (username && username !== currentUser.username) {
        const existing = await tx.user.findUnique({ where: { username } });
        if (existing) throw new Error("Ce nom d'utilisateur est déjà pris.");
        userData.username = username;
      }
      
      if (password && password.trim() !== '') {
        userData.password = await bcrypt.hash(password, 10);
      }
      
      if (name && surname) {
        userData.name = `${name} ${surname}`;
      }
      
      if (img !== undefined) {
          userData.img = img;
      }

      const finalUser = await tx.user.update({
        where: { id: session.userId },
        data: userData,
      });

      // 2. Update Role-specific profile model
      const profileData: any = {};
      if (name) profileData.name = name;
      if (surname) profileData.surname = surname;
      if (phone !== undefined) profileData.phone = phone;
      if (address !== undefined) profileData.address = address;
      if (img !== undefined) profileData.img = img;
      
      if (Object.keys(profileData).length > 0) {
          switch (session.role) {
            case Role.ADMIN:
              await tx.admin.update({ where: { userId: session.userId }, data: { name: profileData.name, surname: profileData.surname, phone: profileData.phone } });
              break;
            case Role.TEACHER:
              await tx.teacher.update({ where: { userId: session.userId }, data: profileData });
              break;
            case Role.STUDENT:
              const { name: _n, surname: _s, ...studentData } = profileData;
              if (Object.keys(studentData).length > 0) {
                await tx.student.update({ where: { userId: session.userId }, data: studentData });
              }
              break;
            case Role.PARENT:
              await tx.parent.update({ where: { userId: session.userId }, data: profileData });
              break;
          }
      }
      return finalUser;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = updatedUser;

    // Re-issue JWT with new data
    const tokenPayload = {
        userId: safeUser.id,
        role: safeUser.role,
        email: safeUser.email,
        name: safeUser.name,
        img: safeUser.img // Include new image in token
    };

    const newToken = jwt.sign(tokenPayload, JWT_SECRET_KEY, { expiresIn: JWT_ACCESS_TOKEN_EXPIRATION_TIME });
    const response = NextResponse.json({ message: "Profil mis à jour avec succès", user: safeUser }, { status: 200 });
    
    // Set the new token in the cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'none',
    });

    return response;

  } catch (error) {
    console.error('[API PUT /profile] Erreur:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
