// src/app/api/lessons/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');
  const classId = searchParams.get('classId');

  if (!teacherId && !classId) {
    return NextResponse.json({ message: 'teacherId ou classId est requis' }, { status: 400 });
  }

  const whereClause: Prisma.LessonWhereInput = {};
  if (teacherId) {
    whereClause.teacherId = teacherId;
  }
  if (classId) {
    whereClause.classId = Number(classId);
  }

  try {
    const lessons = await prisma.lesson.findMany({
      where: whereClause,
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
      },
    });

    return NextResponse.json(lessons, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
