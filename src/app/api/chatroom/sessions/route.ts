// src/app/api/chatroom/sessions/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';
import type { ActiveSession } from '@/types'; // Import a rich session type

export async function POST(request: NextRequest) {
  const sessionInfo = await getServerSession();
  if (!sessionInfo?.userId) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  // Expect the full initial session object from the client
  const initialSession: Partial<ActiveSession> = await request.json();

  const { title, sessionType, classId, participants, quizzes, polls } = initialSession;

  if (!title || !sessionType || !participants || !Array.isArray(participants)) {
    return NextResponse.json({ message: 'Données de session invalides' }, { status: 400 });
  }

  try {
    const hostId = sessionInfo.userId;

    const newSession = await prisma.chatroomSession.create({
      data: {
        title,
        type: sessionType,
        hostId,
        classId: sessionType === 'class' && classId ? parseInt(classId, 10) : null,
        participants: {
          create: participants.map((p) => ({ userId: p.id })),
        },
        // Create related polls and quizzes if they exist
        polls: polls && polls.length > 0 ? {
          create: polls.map(poll => ({
            question: poll.question,
            isActive: poll.isActive,
            options: {
              create: poll.options.map(option => ({
                text: option.text,
              }))
            }
          }))
        } : undefined,
        quizzes: quizzes && quizzes.length > 0 ? {
            create: quizzes.map(quiz => ({
                title: quiz.title,
                isActive: quiz.isActive,
                currentQuestionIndex: 0,
                questions: {
                    create: quiz.questions.map(q => ({
                        question: q.question,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        timeLimit: q.timeLimit,
                    }))
                }
            }))
        } : undefined,
      },
      include: {
        participants: {
          include: {
            user: {
                select: { id: true, name: true, email: true, img: true, role: true }
            }
          }
        },
        messages: true,
        polls: { include: { options: true } },
        quizzes: { include: { questions: true, answers: true } },
      }
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('[API] Erreur lors de la création de la session:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
