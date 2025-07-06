// src/app/[locale]/(auth)/reset-password/page.tsx
"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card className="p-6 text-center text-destructive-foreground bg-destructive">
        <CardContent>
          <p>Le jeton de réinitialisation est manquant ou invalide. Veuillez réessayer.</p>
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Réinitialiser votre mot de passe"
      description="Choisissez un nouveau mot de passe sécurisé."
    >
      <Suspense fallback={<Spinner size="lg" />}>
        <ResetPasswordContent />
      </Suspense>
    </AuthLayout>
  );
}