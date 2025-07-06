// src/app/api/chatroom/reports/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';
import { Role } from '@/types';

export async function GET(request: NextRequest) {
  const sessionInfo = await getServerSession();
  if (!sessionInfo?.userId) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  try {
    const whereClause: any = {
      status: 'ENDED',
    };
    
    // Teachers can only see their own reports. Admins can see all.
    if (sessionInfo.role === Role.TEACHER) {
        whereClause.hostId = sessionInfo.userId;
    } else if (sessionInfo.role !== Role.ADMIN) {
        return NextResponse.json({ message: 'Accès interdit' }, { status: 403 });
    }

    const sessions = await prisma.chatroomSession.findMany({
      where: whereClause,
      include: {
        host: {
            select: { name: true, email: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: {
        endTime: 'desc',
      },
      take: 50, // Limit to the last 50 reports for performance
    });

    const reports = sessions.map(session => ({
        id: session.id,
        classId: String(session.classId),
        className: session.title,
        teacherId: session.hostId,
        teacherName: session.host.name || session.host.email,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString() || '',
        duration: session.endTime ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000) : 0,
        participants: session.participants.map(p => ({
            id: p.user.id,
            name: p.user.name || p.user.email,
            email: p.user.email,
            joinTime: p.joinedAt.toISOString(),
            leaveTime: session.endTime?.toISOString() || '', // Simplified for this example
            duration: session.endTime ? Math.floor((session.endTime.getTime() - p.joinedAt.getTime()) / 1000) : 0
        })),
        maxParticipants: session.participants.length,
        status: session.status,
    }));

    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    console.error(`[API] Erreur lors de la récupération des rapports:`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
