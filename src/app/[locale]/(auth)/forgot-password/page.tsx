// src/app/[locale]/(auth)/forgot-password/page.tsx
"use client";

import { AuthLayout } from '@/components/layout/AuthLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Mot de passe oublié ?"
      description="Pas de souci. Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}