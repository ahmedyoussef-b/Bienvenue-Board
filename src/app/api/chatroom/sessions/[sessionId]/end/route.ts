// src/app/api/chatroom/sessions/[sessionId]/end/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const sessionInfo = await getServerSession();
  if (!sessionInfo?.userId) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { sessionId } = params;

  try {
    const session = await prisma.chatroomSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ message: 'Session non trouvée' }, { status: 404 });
    }

    // Security check: Only the host can end the session
    if (session.hostId !== sessionInfo.userId) {
        return NextResponse.json({ message: 'Seul l\'hôte peut terminer la session' }, { status: 403 });
    }

    const updatedSession = await prisma.chatroomSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endTime: new Date(),
      },
    });

    return NextResponse.json(updatedSession, { status: 200 });
  } catch (error) {
    console.error(`[API] Erreur lors de la fin de la session ${sessionId}:`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
