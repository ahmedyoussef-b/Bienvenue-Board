// src/app/api/auth/forgot-password/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: 'Email requis' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Pour des raisons de sécurité, ne révélez pas que l'utilisateur n'existe pas.
      return NextResponse.json({ message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.' });
    }

    // Générer un jeton de réinitialisation sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Définir une date d'expiration (par exemple, 10 minutes)
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Mettre à jour l'utilisateur avec le jeton de réinitialisation
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    // Construire le lien de réinitialisation
    const resetUrl = `${request.nextUrl.origin}/fr/reset-password?token=${resetToken}`;
    
    // --- SIMULATION D'ENVOI D'EMAIL ---
    // Dans une application réelle, vous enverriez un e-mail à l'utilisateur ici.
    // Pour ce prototype, nous retournons le lien et le jeton.
    console.log('------------------------------------');
    console.log('Lien de réinitialisation de mot de passe (normalement envoyé par email):');
    console.log(resetUrl);
    console.log('------------------------------------');


    return NextResponse.json({ 
      message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.',
      // NOTE : NE PAS retourner le jeton dans une application de production.
      // C'est uniquement pour faciliter le prototypage.
      token: resetToken, 
    });

  } catch (error) {
    console.error('[API FORGOT_PASSWORD] Erreur:', error);
    return NextResponse.json({ message: 'Une erreur interne est survenue.' }, { status: 500 });
  }
}