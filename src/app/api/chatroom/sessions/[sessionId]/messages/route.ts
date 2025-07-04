// src/app/api/chatroom/sessions/[sessionId]/messages/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const sessionInfo = await getServerSession();
  if (!sessionInfo?.userId) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { sessionId } = params;
  const { content } = await request.json();

  if (!content) {
    return NextResponse.json({ message: 'Le contenu du message est requis' }, { status: 400 });
  }

  try {
    // Check if the user is a participant of the session
    const participant = await prisma.sessionParticipant.findUnique({
      where: {
        userId_chatroomSessionId: {
          userId: sessionInfo.userId,
          chatroomSessionId: sessionId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ message: 'Vous ne faites pas partie de cette session' }, { status: 403 });
    }

    const newMessage = await prisma.chatroomMessage.create({
      data: {
        content,
        chatroomSessionId: sessionId,
        authorId: sessionInfo.userId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, img: true, role: true },
        },
      },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error(`[API] Erreur lors de la création du message pour la session ${sessionId}:`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
