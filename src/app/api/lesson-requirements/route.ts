// src/app/api/lesson-requirements/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const lessonRequirementSchema = z.object({
    classId: z.number(),
    subjectId: z.number(),
    hours: z.number().int().min(0),
});

const saveRequirementsSchema = z.array(lessonRequirementSchema);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const requirements = saveRequirementsSchema.parse(body);

        await prisma.$transaction(async (tx) => {
            // Delete all existing requirements. This is simpler than trying to update.
            await tx.lessonRequirement.deleteMany({});
            
            // Create the new set of requirements if any were provided.
            if (requirements.length > 0) {
                await tx.lessonRequirement.createMany({
                    data: requirements,
                });
            }
        });

        const newRequirements = await prisma.lessonRequirement.findMany();
        return NextResponse.json(newRequirements, { status: 200 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
        }
        console.error("Erreur lors de la sauvegarde des exigences horaires:", error);
        return NextResponse.json({ message: "Erreur lors de la sauvegarde des exigences horaires", error: (error as Error).message }, { status: 500 });
    }
}
