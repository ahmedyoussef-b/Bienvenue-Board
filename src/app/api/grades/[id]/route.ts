// src/app/api/grades/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { gradeSchema } from '@/lib/formValidationSchemas';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'ID de niveau invalide' }, { status: 400 });
  }

  try {
    const grade = await prisma.grade.findUnique({
      where: { id },
    });

    if (!grade) {
      return NextResponse.json({ message: 'Niveau non trouvé' }, { status: 404 });
    }
    return NextResponse.json(grade, { status: 200 });
  } catch (error) {
    console.error(`Erreur lors de la récupération du niveau ${id}:`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur lors de la récupération du niveau.', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'ID de niveau invalide' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
    const validation = gradeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Données d\'entrée invalides.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { level } = validation.data;

    const existingGradeWithLevel = await prisma.grade.findFirst({
        where: {
            level: level,
            NOT: {
                id: id
            }
        }
    });

    if (existingGradeWithLevel) {
        return NextResponse.json({ message: `Un autre niveau avec le niveau '${level}' existe déjà.` }, { status: 409 });
    }

    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: { level },
    });

    return NextResponse.json(updatedGrade, { status: 200 });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du niveau ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Niveau non trouvé pour la mise à jour.' }, { status: 404 });
      }
      if (error.code === 'P2002' && body) { // body might be undefined if request.json() fails
        return NextResponse.json({ message: `Un niveau avec le niveau ${body.level} existe déjà.` }, { status: 409 });
      }
    }
    return NextResponse.json({ message: 'Erreur interne du serveur lors de la mise à jour du niveau.', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'ID de niveau invalide' }, { status: 400 });
  }

  try {
    const classesInGrade = await prisma.class.count({
      where: { gradeId: id },
    });

    if (classesInGrade > 0) {
      return NextResponse.json({ message: `Impossible de supprimer le niveau. ${classesInGrade} classe(s) y sont encore associées.` }, { status: 409 });
    }

    const studentsInGrade = await prisma.student.count({
        where: { gradeId: id },
    });

    if (studentsInGrade > 0) {
        return NextResponse.json({ message: `Impossible de supprimer le niveau. ${studentsInGrade} étudiant(s) y sont encore associé(e)s.` }, { status: 409 });
    }

    await prisma.grade.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Niveau supprimé avec succès' }, { status: 200 });
  } catch (error) {
    console.error(`Erreur lors de la suppression du niveau ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Niveau non trouvé pour la suppression.' }, { status: 404 });
      }
      if (error.code === 'P2003') {
         return NextResponse.json({ message: 'Impossible de supprimer le niveau. D\'autres enregistrements en dépendent.', code: error.code }, { status: 409 });
      }
    }
    return NextResponse.json({ message: 'Erreur interne du serveur lors de la suppression du niveau.', error: (error as Error).message }, { status: 500 });
  }
}
