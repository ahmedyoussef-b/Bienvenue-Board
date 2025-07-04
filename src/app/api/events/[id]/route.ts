// src/app/api/events/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { eventSchema } from '@/lib/formValidationSchemas';
import { Prisma } from '@prisma/client';

const updateEventSchema = eventSchema.partial();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "ID d'événement invalide" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validatedData = updateEventSchema.parse(body);

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        classId: validatedData.classId,
      },
    });
    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            return NextResponse.json({ message: 'Événement non trouvé' }, { status: 404 });
        }
        if (error.code === 'P2003') {
             return NextResponse.json({ message: "La classe spécifiée n'existe pas." }, { status: 400 });
        }
    }
    console.error(`Erreur lors de la mise à jour de l'événement ${id}:`, error);
    return NextResponse.json({ message: "Erreur lors de la mise à jour de l'événement", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
        return NextResponse.json({ message: "ID d'événement invalide" }, { status: 400 });
    }

    try {
        await prisma.event.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Événement supprimé avec succès' }, { status: 200 });
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: 'Événement non trouvé' }, { status: 404 });
        }
        console.error(`Erreur lors de la suppression de l'événement ${id}:`, error);
        return NextResponse.json({ message: "Erreur lors de la suppression de l'événement", error: String(error) }, { status: 500 });
    }
}
