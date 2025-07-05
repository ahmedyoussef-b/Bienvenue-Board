// src/app/api/schedule-draft/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';
import { Role } from '@/types';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
    const session = await getServerSession();

    if (!session || session.role !== Role.ADMIN) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }
    
    if (!prisma.scheduleDraft) {
        console.warn('[API/schedule-draft GET] ScheduleDraft model not found on Prisma client.');
        return NextResponse.json(null, { status: 200 });
    }

    try {
        const draft = await prisma.scheduleDraft.findUnique({
            where: { userId: session.userId },
        });

        // If draft is null, client receives null body with 200 OK.
        // If draft is found, client receives draft object with 200 OK.
        return NextResponse.json(draft, { status: 200 });

    } catch (error) {
        console.error('[API/schedule-draft GET] Error:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur lors de la récupération du brouillon.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession();

    if (!session || session.role !== Role.ADMIN) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    if (!prisma.scheduleDraft) {
        console.warn('[API/schedule-draft POST] ScheduleDraft model not found on Prisma client.');
        return NextResponse.json({ message: 'Service de brouillon non disponible (modèle non trouvé).' }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { userId } = session;

        const draftData = {
            userId: userId,
            schoolConfig: body.schoolConfig,
            classes: body.classes,
            subjects: body.subjects,
            teachers: body.teachers,
            classrooms: body.classrooms,
            grades: body.grades,
            lessonRequirements: body.lessonRequirements,
            teacherConstraints: body.teacherConstraints,
            subjectRequirements: body.subjectRequirements,
            teacherAssignments: body.teacherAssignments,
            schedule: body.schedule,
        };

        const savedDraft = await prisma.scheduleDraft.upsert({
            where: { userId: userId },
            update: draftData,
            create: draftData,
        });
        
        return NextResponse.json({ message: 'Brouillon sauvegardé avec succès', updatedAt: savedDraft.updatedAt }, { status: 200 });

    } catch (error) {
        console.error('[API/schedule-draft POST] Error:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
            return NextResponse.json({ message: 'Service de brouillon non disponible (table non trouvée).' }, { status: 503 });
        }
        return NextResponse.json({ message: 'Erreur lors de la sauvegarde du brouillon.' }, { status: 500 });
    }
}
