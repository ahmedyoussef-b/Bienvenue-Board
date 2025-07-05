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
  console.log('--- [API /api/auth/session] DÉBUT de la vérification de session ---');

  if (!JWT_SECRET_KEY) {
    console.error('❌ [API /api/auth/session] ERREUR : JWT_SECRET_KEY n\'est pas défini dans l\'environnement.');
    return NextResponse.json({ message: 'Erreur de configuration interne' }, { status: 500 });
  }
  console.log('✅ [API /api/auth/session] JWT_SECRET_KEY est présent.');

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      console.log('⚠️ [API /api/auth/session] Le cookie de session est introuvable. L\'utilisateur n\'est probablement pas connecté.');
      return NextResponse.json({ message: 'Aucun token de session actif trouvé' }, { status: 401 });
    }
    console.log(`🍪 [API /api/auth/session] Token trouvé dans le cookie : ${token.substring(0, 30)}...`);

    let decoded: JwtPayload;
    try {
      console.log('🔍 [API /api/auth/session] Tentative de vérification du JWT...');
      decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
      console.log('✅ [API /api/auth/session] JWT vérifié avec succès. Payload :', decoded);
    } catch (error: any) {
      console.error('❌ [API /api/auth/session] ERREUR lors de la vérification du JWT :', error.message);
      const clearResponse = NextResponse.json({ message: 'Token de session invalide ou expiré' }, { status: 401 });
      clearResponse.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return clearResponse;
    }

    console.log(`👤 [API /api/auth/session] Recherche de l'utilisateur avec l'ID : ${decoded.userId}`);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      console.warn(`⚠️ [API /api/auth/session] Utilisateur avec l'ID ${decoded.userId} non trouvé dans la base de données.`);
      const clearResponse = NextResponse.json({ message: 'Utilisateur de la session non trouvé' }, { status: 401 });
      clearResponse.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: -1, path: '/' });
      return clearResponse;
    }
    console.log('✅ [API /api/auth/session] Utilisateur trouvé :', user.email, user.role);
    
    // --- Simplified logic to rely on User.name ---
    const finalName = user.name || user.username || user.email;

    const { password: _, ...userScalars } = user;

    const safeUser: SafeUser = {
      ...userScalars,
      name: finalName,
      role: user.role as AppRole,
    };
    
    console.log('✅ [API /api/auth/session] Session valide. Envoi de la réponse avec les données utilisateur.');
    return NextResponse.json({ user: safeUser }, { status: 200 });

  } catch (error: any) {
    console.error(`❌ [API /api/auth/session] ERREUR INATTENDUE dans le bloc principal :`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur lors de la vérification de la session' }, { status: 500 });
  }
}
