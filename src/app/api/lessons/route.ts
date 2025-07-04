// src/app/api/lessons/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { lessonSchema } from '@/lib/formValidationSchemas';
import { Prisma } from '@prisma/client';

// Helper to construct a Date object from a "HH:mm" string for today
const createDateFromTime = (time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  // Using a fixed arbitrary date (like epoch) ensures only the time part is relevant for Prisma
  const date = new Date(0);
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = lessonSchema.parse(body);
    
    const { startTime, endTime, classroomId, ...rest } = validatedData;
    
    const newLesson = await prisma.lesson.create({
      data: {
        ...rest,
        startTime: createDateFromTime(startTime),
        endTime: createDateFromTime(endTime),
        classroomId: classroomId ?? null,
      },
    });

    return NextResponse.json(newLesson, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') { // Foreign key constraint failed
             return NextResponse.json({ message: "L'une des entités spécifiées (classe, matière, etc.) n'existe pas." }, { status: 400 });
        }
    }
    console.error("Erreur lors de la création du cours:", error);
    return NextResponse.json({ message: "Erreur lors de la création du cours", error: String(error) }, { status: 500 });
  }
}
