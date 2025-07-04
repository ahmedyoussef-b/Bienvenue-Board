// src/app/api/lessons/batch/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Day } from '@prisma/client';

const lessonSchema = z.object({
  name: z.string(),
  day: z.nativeEnum(Day),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  subjectId: z.number().int(),
  classId: z.number().int(),
  teacherId: z.string(),
  classroomId: z.number().int().optional().nullable(),
});

const batchLessonSchema = z.object({
  lessons: z.array(lessonSchema),
});

export async function POST(request: NextRequest) {
  console.log("➡️ [API] POST /api/lessons/batch: Requête reçue.");
  try {
    const body = await request.json();
    console.log(`[API] Corps de la requête reçu: ${JSON.stringify(body, null, 2).substring(0, 500)}...`);
    
    const validation = batchLessonSchema.safeParse(body);

    if (!validation.success) {
      console.error("❌ [API] Erreur de validation Zod:", validation.error.flatten());
      return NextResponse.json({ message: 'Données invalides', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { lessons } = validation.data;
    console.log(`[API] Données validées. Préparation à l'enregistrement de ${lessons.length} cours.`);
    
    const lessonsToCreate = lessons.map(l => ({
        ...l,
        startTime: new Date(l.startTime),
        endTime: new Date(l.endTime),
    }));

    console.log("[API] Début de la transaction de base de données pour remplacer l'emploi du temps.");
    
    await prisma.$transaction(async (tx) => {
      // Étape 1 : Obtenir tous les IDs des leçons existantes
      console.log("[API] Transaction: Étape 1 - Recherche des leçons existantes...");
      const existingLessons = await tx.lesson.findMany({ select: { id: true } });
      const lessonIds = existingLessons.map(l => l.id);
      console.log(`[API] Transaction: ${lessonIds.length} leçons existantes trouvées.`);

      if (lessonIds.length > 0) {
        // Étape 2 : Obtenir les IDs des examens et devoirs liés
        console.log("[API] Transaction: Étape 2 - Recherche des examens et devoirs liés...");
        const existingExams = await tx.exam.findMany({ where: { lessonId: { in: lessonIds } }, select: { id: true } });
        const examIds = existingExams.map(e => e.id);
        const existingAssignments = await tx.assignment.findMany({ where: { lessonId: { in: lessonIds } }, select: { id: true } });
        const assignmentIds = existingAssignments.map(a => a.id);
        console.log(`[API] Transaction: ${examIds.length} examens et ${assignmentIds.length} devoirs liés trouvés.`);

        // Étape 3 : Supprimer les dépendances les plus profondes (Résultats)
        if (examIds.length > 0 || assignmentIds.length > 0) {
            console.log("[API] Transaction: Étape 3 - Suppression des résultats liés...");
            await tx.result.deleteMany({
                where: { OR: [ { examId: { in: examIds } }, { assignmentId: { in: assignmentIds } } ] }
            });
            console.log("[API] Transaction: Résultats supprimés.");
        }
        
        // Étape 4 : Supprimer les autres dépendances directes des leçons
        console.log("[API] Transaction: Étape 4.1 - Suppression des présences...");
        await tx.attendance.deleteMany({ where: { lessonId: { in: lessonIds } } });
        console.log("[API] Transaction: Présences supprimées.");

        if (examIds.length > 0) {
            console.log("[API] Transaction: Étape 4.2 - Suppression des examens...");
            await tx.exam.deleteMany({ where: { id: { in: examIds } } });
            console.log("[API] Transaction: Examens supprimés.");
        }

        if (assignmentIds.length > 0) {
            console.log("[API] Transaction: Étape 4.3 - Suppression des devoirs...");
            await tx.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
            console.log("[API] Transaction: Devoirs supprimés.");
        }
      }

      // Étape 5 : Supprimer tous les anciens cours
      console.log("[API] Transaction: Étape 5 - Suppression des anciens cours...");
      await tx.lesson.deleteMany({});
      console.log("[API] Transaction: Anciens cours supprimés.");

      // Étape 6 : Créer les nouveaux cours
      console.log(`[API] Transaction: Étape 6 - Création de ${lessonsToCreate.length} nouveaux cours...`);
      if (lessonsToCreate.length > 0) {
        await tx.lesson.createMany({
          data: lessonsToCreate,
        });
        console.log("[API] Transaction: Nouveaux cours créés avec succès.");
      } else {
        console.log("[API] Transaction: Aucun nouveau cours à créer.");
      }
    });

    console.log("✅ [API] Transaction terminée avec succès. Envoi de la réponse au client.");
    return NextResponse.json({ message: 'Emploi du temps enregistré avec succès', count: lessons.length }, { status: 201 });

  } catch (error: unknown) {
    console.error("❌ [API] Erreur catastrophique lors de l'enregistrement de l'emploi du temps:", error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    // Log the stack trace if available
    if (error instanceof Error && error.stack) {
        console.error("Stack Trace:", error.stack);
    }
    return NextResponse.json({ message: "Erreur lors de l'enregistrement de l'emploi du temps", error: errorMessage }, { status: 500 });
  }
}
