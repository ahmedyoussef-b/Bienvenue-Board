// src/app/api/chatroom/teachers/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserSex } from '@prisma/client'; // Assuming UserSex is defined here

// Define a new interface that matches the exact structure returned by the Prisma query
interface PrismaTeacherWithUser {
  id: string;
  name: string;
  surname: string;
  img: string | null;
  userId: string;
  phone: string | null;
  address: string | null;
  bloodType: string | null;
  birthday: Date | null;
  sex: UserSex | null;
  user: {
    email: string | null;
    img: string | null;
  } | null;
};

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({ // Cast the result to the new interface array
      select: {
        id: true,
        name: true,
        surname: true,
        img: true,
        userId: true,
        phone: true,
        address: true,
        bloodType: true,
        birthday: true,
        sex: true,
        user: { select: { email: true, img: true } },
      },
      orderBy: [{ surname: 'asc' }, { name: 'asc' }],
    }) as PrismaTeacherWithUser[];
    const participants = teachers.map((t) => ({
      id: t.userId, // Use the USER's ID for the session participant
      name: `${t.name} ${t.surname}`,
      email: t.user?.email || 'N/A',
      img: t.user?.img || t.img,
      role: 'teacher',
      isOnline: Math.random() > 0.3, // Simulate presence
      isInSession: false,
      points: 0,
      badges: [],
    }));

    return NextResponse.json(participants);
  } catch (error) {
    console.error("Erreur lors de la récupération des professeurs pour le chatroom:", error);
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
  }
}
