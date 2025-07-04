// src/app/api/auth/session/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import type { Role as AppRole, SafeUser, JwtPayload } from "@/types/index";

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const SESSION_COOKIE_NAME = 'appSessionToken';

export async function GET(req: NextRequest) {
  if (!JWT_SECRET_KEY) {
    console.error('🍪 API Session: JWT_SECRET_KEY n\'est pas défini.');
    return NextResponse.json({ message: 'Erreur de configuration' }, { status: 500 });
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ message: 'Aucun token de session actif trouvé' }, { status: 401 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
    } catch (error: any) {
      const clearResponse = NextResponse.json({ message: 'Token de session invalide' }, { status: 401 });
      clearResponse.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return clearResponse;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      const clearResponse = NextResponse.json({ message: 'Utilisateur non trouvé pour la session' }, { status: 401 });
      clearResponse.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return clearResponse;
    }
    
    // --- Simplified logic to rely on User.name ---
    const finalName = user.name || user.username || user.email;

    const { password: _, ...userScalars } = user;

    const safeUser: SafeUser = {
      ...userScalars,
      name: finalName,
      role: user.role as AppRole,
    };
    
    return NextResponse.json({ user: safeUser }, { status: 200 });

  } catch (error: any) {
    console.error(`🍪 API Session: Erreur interne du serveur lors de la vérification de la session.`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur lors de la vérification de la session' }, { status: 500 });
  }
}
