// src/app/api/chatroom/classes/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client';

// Define type for student details as selected in the query
interface StudentDetails {
  id: string; // This is the Student's own ID
  userId: string; // This is the ID from the related User model
  name: string;
  surname: string;
  user: {
    email: string;
    img: string | null;
  };
}

// Define type for Class including students, matching the select in include
interface ClassWithStudents extends Prisma.ClassGetPayload<{
  include: { students: { select: { id: true; userId: true; name: true; surname: true; user: { select: { email: true; img: true; }; }; }; orderBy: { name: 'asc'; }; }; };
}> {
  students: StudentDetails[];
}
export async function GET() {
  try {
    const classesWithStudents = await prisma.class.findMany({
      include: {
        students: {
          select: { id: true, userId: true, name: true, surname: true, user: { select: { email: true, img: true } } },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }) as ClassWithStudents[]; // Explicitly cast the result

    const classRooms = classesWithStudents.map((cls) => ({ // No need to explicitly type cls here
      id: cls.id,
      name: cls.name,
      students: cls.students.map((s: StudentDetails) => ({ // Explicitly type s
        id: s.userId, // Use the USER's ID for the session participant
        name: `${s.name} ${s.surname}`,
        email: s.user?.email || 'N/A',
        img: s.user?.img,
        role: 'student',
        isOnline: Math.random() > 0.3, 
        isInSession: false,
        points: 0,
        badges: [],
      })),
    }));

    return NextResponse.json(classRooms);
  } catch (error) {
    console.error("Erreur lors de la récupération des classes pour le chatroom:", error);
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
  }
}
