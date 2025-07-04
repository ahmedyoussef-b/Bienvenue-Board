// src/app/api/chatroom/sessions/[sessionId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const sessionInfo = await getServerSession();
  if (!sessionInfo?.userId) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { sessionId } = params;

  try {
    const session = await prisma.chatroomSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, img: true, role: true },
            },
          },
        },
        messages: {
          include: {
            author: {
              select: { id: true, name: true, email: true, img: true, role: true },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ message: 'Session non trouvée' }, { status: 404 });
    }

    // Security check: Ensure the requesting user is part of the session
    const isParticipant = session.participants.some(p => p.userId === sessionInfo.userId);
    if (!isParticipant) {
        return NextResponse.json({ message: 'Accès interdit à cette session' }, { status: 403 });
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error(`[API] Erreur lors de la récupération de la session ${sessionId}:`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
