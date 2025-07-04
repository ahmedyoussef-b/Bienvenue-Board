// src/app/api/grades/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { gradeSchema } from '@/lib/formValidationSchemas';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
    const validation = gradeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Données d\'entrée invalides.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { level } = validation.data;

    const existingGrade = await prisma.grade.findFirst({
      where: { level },
    });

    if (existingGrade) {
      return NextResponse.json({ message: `Un niveau avec le niveau '${level}' existe déjà.` }, { status: 409 });
    }

    const newGrade = await prisma.grade.create({
      data: {
        level,
      },
    });

    return NextResponse.json(newGrade, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création du niveau:', error);
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && body) { 
        return NextResponse.json({ message: `Un niveau avec le niveau ${body.level} existe déjà.` }, { status: 409 });
      }
    }
    return NextResponse.json({ message: 'Erreur interne du serveur lors de la création du niveau.', error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: {
        level: 'asc',
      },
    });
    return NextResponse.json(grades, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur lors de la récupération des niveaux.', error: (error as Error).message }, { status: 500 });
  }
}
