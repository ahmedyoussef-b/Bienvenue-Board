// src/app/api/schedule-draft/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';
import { z } from 'zod';

const createDraftSchema = z.object({
  name: z.string().min(1, 'Le nom du scénario est requis.'),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
    const session = await getServerSession();
    if (!session?.userId) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        // Fetch only the active draft for this user
        const activeDraft = await prisma.scheduleDraft.findFirst({
            where: { 
                userId: session.userId,
                isActive: true,
            },
        });
        
        if (!activeDraft) {
            // Return null or an empty object if no active draft is found, which is an expected scenario.
            // Using 204 No Content might be semantically better, but this works with the client setup.
            return NextResponse.json(null, { status: 200 });
        }

        return NextResponse.json(activeDraft, { status: 200 });
    } catch (error) {
        console.error('[API/schedule-draft/active GET] Error:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession();
    if (!session?.userId) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validation = createDraftSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Données invalides', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { name, description } = validation.data;
        const { schoolConfig, ...initialData } = body.initialData || {};

        // When creating a new draft, deactivate all others for this user
        await prisma.scheduleDraft.updateMany({
            where: { userId: session.userId },
            data: { isActive: false },
        });

        const newDraft = await prisma.scheduleDraft.create({
            data: {
                userId: session.userId,
                name,
                description,
                isActive: true, // New drafts are now active by default
                schoolConfig: schoolConfig || {},
                classes: initialData.classes || [],
                subjects: initialData.subjects || [],
                teachers: initialData.teachers || [],
                classrooms: initialData.classrooms || [],
                grades: initialData.grades || [],
                lessonRequirements: initialData.lessonRequirements || [],
                teacherConstraints: initialData.teacherConstraints || [],
                subjectRequirements: initialData.subjectRequirements || [],
                teacherAssignments: initialData.teacherAssignments || [],
                schedule: initialData.schedule || [],
            },
        });

        return NextResponse.json(newDraft, { status: 201 });
    } catch (error: any) {
        console.error('[API/schedule-draft POST] Error:', error);
        if (error.code === 'P2002') {
             return NextResponse.json({ message: 'Un scénario avec ce nom existe déjà.' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Erreur lors de la création du scénario.' }, { status: 500 });
    }
}
