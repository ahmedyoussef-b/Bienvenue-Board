
// src/lib/auth-utils.ts
'use server';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { Role, JwtPayload as AppJwtPayload } from '@/types/index';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('appSessionToken')?.value;

   if (!token) {
    return null;
  }
  if (!JWT_SECRET_KEY) {
    console.error('🛡️ auth-utils (getServerSession): JWT_SECRET_KEY n\'est pas défini. Impossible de vérifier le token.');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as AppJwtPayload;
    return {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name || decoded.email, // Fallback for name
      isAuthenticated: true,
    };
  } catch (e: any) {
    // Errors like TokenExpiredError, JsonWebTokenError etc. are caught here.
    // In all token error cases, the session is invalid.
    return null;
  }
}
