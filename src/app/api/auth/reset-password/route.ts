// src/app/api/auth/reset-password/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const HASH_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ message: 'Jeton et nouveau mot de passe requis' }, { status: 400 });
    }

    // Hasher le jeton reçu pour le comparer à celui de la base de données
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Trouver l'utilisateur par le jeton et vérifier qu'il n'a pas expiré
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Jeton invalide ou expiré' }, { status: 400 });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, HASH_ROUNDS);

    // Mettre à jour le mot de passe et supprimer les jetons de réinitialisation
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return NextResponse.json({ message: 'Mot de passe réinitialisé avec succès.' });

  } catch (error) {
    console.error('[API RESET_PASSWORD] Erreur:', error);
    return NextResponse.json({ message: 'Une erreur interne est survenue.' }, { status: 500 });
  }
}