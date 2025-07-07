// src/lib/auth-utils.ts
'use server';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { Role, JwtPayload as AppJwtPayload } from '@/types/index';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export async function getServerSession() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  console.log('🛡️ [auth-utils] All cookies received by server:', allCookies);

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
    return {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name || decoded.email, // Fallback for name
      isAuthenticated: true,
    };
  } catch (e: any) {
    console.error('[Server] Token verification failed. Error:', e.message);
    return null;
  }
}
