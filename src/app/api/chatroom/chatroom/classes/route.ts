import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface StudentDetails {
  id: string;
  name: string;
  surname: string;
  user: {
    email: string | null;
    img: string | null;
  };
}

interface ClassWithStudents {
  id: number;
  name: string;
  gradeId: number;
  capacity: number;
  abbreviation: string | null;
  supervisorId: string | null;
  students: StudentDetails[];
}

export async function GET() {
  try {
    const classesWithStudents = await prisma.class.findMany({
      include: {
        students: {
          select: { id: true, name: true, surname: true, user: { select: { email: true, img: true } } },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }) as ClassWithStudents[];

    const classRooms = classesWithStudents.map((cls) => ({
      id: cls.id,
      name: cls.name,
      students: cls.students.map((s) => ({
        id: s.id,
        name: `${s.name} ${s.surname}`,
        email: s.user?.email || 'N/A',
        img: s.user?.img,
        role: 'student',
        isOnline: Math.random() > 0.3, // Placeholder
        isInSession: Math.random() < 0.5, // Placeholder
        points: Math.floor(Math.random() * 100), // Placeholder
        badges: [], // Placeholder
      })),
    }));

    return NextResponse.json(classRooms);
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}