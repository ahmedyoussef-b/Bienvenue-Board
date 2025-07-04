// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { z } from 'zod';
import { profileUpdateSchema } from '@/lib/formValidationSchemas';

export async function PUT(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.userId || !session.role) {
    return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
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

    await prisma.$transaction(async (tx) => {
      // 1. Update User model
      const userData: Prisma.UserUpdateInput = {};
      
      // Only check for uniqueness if the email is actually changing
      if (email && email !== currentUser.email) {
        const existing = await tx.user.findUnique({ where: { email } });
        if (existing) throw new Error("Cet e-mail est déjà utilisé par un autre compte.");
        userData.email = email;
      }

      // Only check for uniqueness if the username is actually changing
      if (username && username !== currentUser.username) {
        const existing = await tx.user.findUnique({ where: { username } });
        if (existing) throw new Error("Ce nom d'utilisateur est déjà pris.");
        userData.username = username;
      }
      
      if (password && password.trim() !== '') {
        userData.password = await bcrypt.hash(password, 10);
      }
      
      // Update User.name only if profile name/surname are provided (not for students from this form)
      if (name && surname) {
        userData.name = `${name} ${surname}`;
      }
      
      if (img !== undefined) {
          userData.img = img;
      }

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: session.userId },
          data: userData,
        });
      }

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
              // Student model doesn't have name/surname, they are on User model, but phone/address are here
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
    });

    return NextResponse.json({ message: "Profil mis à jour avec succès" }, { status: 200 });

  } catch (error) {
    console.error('[API PUT /profile] Erreur:', error);
    if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
