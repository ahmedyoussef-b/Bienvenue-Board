// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SafeUser, Role as AppRole } from '@/types/index'; 

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const jwtExpirationEnv = process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME;
const EFFECTIVE_JWT_EXPIRATION_TIME = (jwtExpirationEnv && jwtExpirationEnv.trim() !== '') ? jwtExpirationEnv : '1h';
const SESSION_COOKIE_NAME = 'appSessionToken';

export const POST = async (req: NextRequest) => {
  console.log('--- [API /api/auth/login] DÉBUT de la tentative de connexion ---');
  if (!JWT_SECRET_KEY) {
    console.error('❌ [API /api/auth/login] ERREUR : JWT_SECRET_KEY n\'est pas défini.');
    return NextResponse.json({ message: 'Erreur de configuration interne' }, { status: 500 });
  }
  console.log('✅ [API /api/auth/login] JWT_SECRET_KEY est présent.');

  const body = await req.json();
  const { email, password } = body;
  console.log(`[API /api/auth/login] Tentative de connexion pour l'email : ${email}`);

  if (!email || !password) {
    console.warn(`[API /api/auth/login] Email ou mot de passe manquant dans la requête.`);
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.warn(`[API /api/auth/login] Utilisateur non trouvé pour l'email : ${email}`);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (!user.password) {
        console.error(`[API /api/auth/login] ERREUR: L'utilisateur ${email} n'a pas de mot de passe dans la base de données.`);
        return NextResponse.json({ message: 'Invalid user record (missing password)' }, { status: 401 });
    }
    
    console.log(`[API /api/auth/login] Utilisateur trouvé : ${user.email}. Comparaison des mots de passe...`);
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.warn(`[API /api/auth/login] Le mot de passe est incorrect pour l'utilisateur ${email}.`);
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    console.log(`✅ [API /api/auth/login] Mot de passe correct pour ${email}.`);
    
    const finalName = user.name || user.username || user.email;
    const userRole = user.role as AppRole;
    
    const tokenPayload = {
        userId: user.id,
        role: userRole,
        email: user.email,
        name: finalName,
    };

    const secretKey: Secret = JWT_SECRET_KEY;
    const signOptions: SignOptions = {
        expiresIn: EFFECTIVE_JWT_EXPIRATION_TIME 
    };

    console.log(`[API /api/auth/login] Création du JWT avec le payload :`, tokenPayload);
    const token = jwt.sign(tokenPayload, secretKey, signOptions);
    console.log(`[API /api/auth/login] JWT créé : ${token.substring(0, 30)}...`);
    
    const { password: _, ...userScalars } = user;

    const safeUserResponse: SafeUser = {
      ...userScalars,
      name: finalName,
      role: userRole,
    };
    
    const response = NextResponse.json({ token, user: safeUserResponse }, { status: 200 });
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'lax',
    } as const;

    console.log(`[API /api/auth/login] Définition du cookie de session "${SESSION_COOKIE_NAME}" avec les options :`, cookieOptions);
    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);

    console.log(`✅ [API /api/auth/login] Connexion réussie. Envoi de la réponse.`);
    return response;

  } catch (error) {
    console.error('❌ [API /api/auth/login] ERREUR INATTENDUE :', error);
    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json({ message: `Database error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred during login' }, { status: 500 });
  }
};
