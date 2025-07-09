// src/lib/auth-utils.ts
'use server';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { JwtPayload as AppJwtPayload } from '@/types/index';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

// Définir un type de retour explicite pour plus de clarté
type ServerSession = {
 userId: string;
  role: Role; // Use the Role enum from Prisma Client
  email: string;
  name: string;
  isAuthenticated: boolean;
  img: string | null;
};

export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
   if (!token) {
    console.log('🛡️ [auth-utils] No session token cookie found.');
    return null;
  }
  if (!JWT_SECRET_KEY) {
    console.error('🛡️ [Server] auth-utils: JWT_SECRET_KEY is not defined. Cannot verify token.');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as AppJwtPayload;
    console.log(`🛡️ [auth-utils] Token verified for userId: ${decoded.userId}. Fetching fresh user data...`);

    // --- FIX: Récupérer les données utilisateur à jour depuis la base de données ---
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
    });

    if (!user) {
        console.warn(`🛡️ [auth-utils] User from token (ID: ${decoded.userId}) not found in DB.`);
        return null;
    }
    
    console.log('🛡️ [auth-utils] Fresh user data fetched. Building session object.');

    // --- FIX: Construire l'objet de session à partir des données fraîches ---
    return {
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name || user.email,
      isAuthenticated: true,
      img: user.img, // La nouvelle URL de l'image est maintenant incluse
    };

  } catch (e: any) {
    console.error('🛡️ [auth-utils] Server token verification failed. Error:', e.message);
    return null;
  }
}
