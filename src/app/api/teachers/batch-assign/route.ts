// src/app/api/teachers/batch-assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const assignmentSchema = z.object({
  teacherId: z.string(),
  classIds: z.array(z.number()),
});

const batchAssignSchema = z.array(assignmentSchema);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = batchAssignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const assignments = validation.data;
    
    // Validate that a class is not assigned to more than one teacher in the payload.
    const classAssignments = new Map<number, string>();
    for (const assignment of assignments) {
      for (const classId of assignment.classIds) {
        if (classAssignments.has(classId)) {
          return NextResponse.json({
            message: `Conflit d'assignation : La classe ID ${classId} est assignée à plusieurs professeurs dans cette requête.`,
          }, { status: 409 });
        }
        classAssignments.set(classId, assignment.teacherId);
      }
    }

    await prisma.$transaction(async (tx) => {
      // Step 1: Un-assign all classes currently supervised by any of the teachers in this batch.
      // This ensures that if a teacher loses a supervision, it's correctly updated.
      const teacherIdsInvolved = assignments.map(a => a.teacherId);
      await tx.class.updateMany({
        where: {
          supervisorId: {
            in: teacherIdsInvolved,
          },
        },
        data: {
          supervisorId: null,
        },
      });

      // Step 2: Set the new assignments.
      // This is safe because we've validated for conflicts and cleared previous assignments for these teachers.
      for (const assignment of assignments) {
        if (assignment.classIds.length > 0) {
          await tx.class.updateMany({
            where: {
              id: { in: assignment.classIds },
            },
            data: {
              supervisorId: assignment.teacherId,
            },
          });
        }
      }
    });

    return NextResponse.json({ message: "Assignations des professeurs mises à jour avec succès." }, { status: 200 });

  } catch (error) {
    console.error('[API/batch-assign] An error occurred:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[API/batch-assign] Prisma Error:', { code: error.code, meta: error.meta, message: error.message });
       if (error.code === 'P2003') { // Foreign key constraint failed
          return NextResponse.json({ message: `Erreur de référence: un professeur ou une classe spécifié n'existe pas.`, details: error.meta }, { status: 400 });
      }
      return NextResponse.json({ message: `Erreur de base de données. Code: ${error.code}`, details: error.meta }, { status: 500 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Une erreur interne est survenue.';
    return NextResponse.json({ message: "Une erreur interne est survenue lors de la sauvegarde des assignations.", error: errorMessage }, { status: 500 });
  }
}
