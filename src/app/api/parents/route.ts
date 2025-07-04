
// src/app/api/parents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { parentSchema } from '@/lib/formValidationSchemas';

const HASH_ROUNDS = 10;

// POST (create) a new parent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = parentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { username, email, password, name, surname, phone, address, img } = validation.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      let message = 'Un utilisateur existe déjà.';
      if (existingUser.email === email) message = 'Un utilisateur existe déjà avec cet email.';
      if (existingUser.username === username) message = 'Ce nom d\'utilisateur est déjà pris.';
      return NextResponse.json({ message }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password!, HASH_ROUNDS);

    const createdParentWithUser = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: Role.PARENT,
          name: `${name} ${surname}`,
          active: true,
          img: img || null,
        },
      });

      const newParent = await tx.parent.create({
        data: {
          userId: newUser.id,
          name,
          surname,
          phone: phone || null,
          address: address || '',
          img: img || null,
        },
        include: { user: true },
      });
      return newParent;
    });

    return NextResponse.json(createdParentWithUser, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création du parent :', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: "Un utilisateur avec cet email ou nom d'utilisateur existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: (error as Error).message }, { status: 500 });
  }
}
