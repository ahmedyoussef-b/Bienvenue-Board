// src/app/api/schedule-drafts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';

// This new route handles fetching ALL drafts for a user.
export async function GET(request: NextRequest) {
    const session = await getServerSession();
    if (!session?.userId) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const drafts = await prisma.scheduleDraft.findMany({
            where: { userId: session.userId },
            orderBy: { updatedAt: 'desc' },
        });
        return NextResponse.json(drafts, { status: 200 });
    } catch (error) {
        console.error('[API/schedule-drafts GET] Error:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.' }, { status: 500 });
    }
}
