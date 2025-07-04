// src/app/api/events/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { eventSchema } from '@/lib/formValidationSchemas';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = eventSchema.parse(body);

    const newEvent = await prisma.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        classId: validatedData.classId,
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') { // Foreign key constraint failed on 'classId'
        return NextResponse.json({ message: "La classe spécifiée n'existe pas." }, { status: 400 });
      }
    }
    console.error("Erreur lors de la création de l'événement:", error);
    return NextResponse.json({ message: "Erreur lors de la création de l'événement", error: String(error) }, { status: 500 });
  }
}
