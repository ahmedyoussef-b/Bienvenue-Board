// src/app/api/schedule-drafts/[id]/activate/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession();
    if (!session?.userId) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }
    
    const { id } = params;

    try {
        await prisma.$transaction(async (tx) => {
            // Deactivate all other drafts for this user
            await tx.scheduleDraft.updateMany({
                where: {
                    userId: session.userId,
                    NOT: { id },
                },
                data: { isActive: false },
            });
            
            // Activate the selected draft
            await tx.scheduleDraft.update({
                where: { id, userId: session.userId },
                data: { isActive: true },
            });
        });
        
        return NextResponse.json({ message: 'Scénario activé avec succès.' }, { status: 200 });

    } catch (error) {
        console.error(`[API] Erreur lors de l'activation du brouillon ${id}:`, error);
        return NextResponse.json({ message: 'Erreur lors de l\'activation du scénario.' }, { status: 500 });
    }
}
