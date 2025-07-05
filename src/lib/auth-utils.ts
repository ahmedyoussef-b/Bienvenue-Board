// src/lib/auth-utils.ts
'use server';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { Role, JwtPayload as AppJwtPayload } from '@/types/index';

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export async function getServerSession() {
  console.log('--- [Server] getServerSession called ---');
  const cookieStore = await cookies();
  const token = cookieStore.get('appSessionToken')?.value;
  
  console.log(`[Server] Token from cookie: ${token ? 'found' : 'NOT found'}`);

   if (!token) {
    console.log('[Server] No token, returning null.');
    return null;
  }
  if (!JWT_SECRET_KEY) {
    console.error('🛡️ [Server] auth-utils: JWT_SECRET_KEY is not defined. Cannot verify token.');
    return null;
  }

  try {
    console.log('[Server] Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as AppJwtPayload;
    console.log('[Server] Token verified successfully. Decoded payload:', decoded);
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
