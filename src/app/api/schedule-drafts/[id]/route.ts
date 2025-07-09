// src/app/api/schedule-drafts/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';
import { Prisma } from '@prisma/client';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession();
    if (!session?.userId) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();


    try {
        const { name, description, ...draftData } = body;
        
        const updatePayload: Prisma.ScheduleDraftUpdateInput = { ...draftData };
        if (name) updatePayload.name = name;
        if (description) updatePayload.description = description;

        const updatedDraft = await prisma.scheduleDraft.update({
            where: { id, userId: session.userId },
            data: updatePayload,
        });
        
        return NextResponse.json(updatedDraft, { status: 200 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             return NextResponse.json({ message: 'Un scénario avec ce nom existe déjà.' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Erreur lors de la mise à jour du scénario.' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession();
    if (!session?.userId) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    const { id } = params;

    try {
        await prisma.scheduleDraft.delete({
            where: { id, userId: session.userId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return NextResponse.json({ message: 'Scénario non trouvé.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Erreur lors de la suppression du scénario.' }, { status: 500 });
    }
}
