// src/app/api/auth/forgot-password/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
    
    // --- Configuration pour l'envoi d'e-mail ---
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailHtml = `
      <p>Bonjour,</p>
      <p>Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour continuer :</p>
      <a href="${resetUrl}" target="_blank">Réinitialiser mon mot de passe</a>
      <p>Ce lien expirera dans 10 minutes.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail.</p>
    `;

    // Envoyer l'e-mail
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe SchooLama',
      html: emailHtml,
    });
    
    // La simulation est maintenant remplacée par l'envoi réel.
    // Nous ne retournons plus le jeton au client.
    return NextResponse.json({ 
      message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.',
    });

  } catch (error) {
    console.error('[API FORGOT_PASSWORD] Erreur:', error);
    return NextResponse.json({ message: 'Une erreur interne est survenue lors de l\'envoi de l\'email.' }, { status: 500 });
  }
}
