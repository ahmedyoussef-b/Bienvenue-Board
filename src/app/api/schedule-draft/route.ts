// src/app/api/schedule-draft/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';
import { Role } from '@/types';

export async function GET(request: NextRequest) {
    const session = await getServerSession();

    if (!session || session.role !== Role.ADMIN) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const draft = await prisma.scheduleDraft.findUnique({
            where: { userId: session.userId },
        });

        if (!draft) {
            return NextResponse.json({ message: 'Aucun brouillon trouvé' }, { status: 404 });
        }

        return NextResponse.json(draft, { status: 200 });
    } catch (error) {
        console.error('[API/schedule-draft GET] Error:', error);
        return NextResponse.json({ message: 'Erreur lors de la récupération du brouillon.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession();

    if (!session || session.role !== Role.ADMIN) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
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
        return NextResponse.json({ message: 'Erreur lors de la sauvegarde du brouillon.' }, { status: 500 });
    }
}
