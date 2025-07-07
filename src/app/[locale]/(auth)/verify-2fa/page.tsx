// src/app/[locale]/(auth)/verify-2fa/page.tsx
"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import Verify2FAForm from '@/components/auth/Verify2FAForm';

function Verify2FAContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card className="p-6 text-center text-destructive-foreground bg-destructive">
        <CardContent>
          <p>Le jeton de vérification est manquant ou invalide. Veuillez réessayer de vous connecter.</p>
        </CardContent>
      </Card>
    );
  }

  return <Verify2FAForm token={token} />;
}

export default function Verify2FAPage() {
  return (
    <AuthLayout
      title="Vérification en deux étapes"
      description="Un code a été envoyé à votre adresse e-mail. Veuillez le saisir ci-dessous."
    >
      <Suspense fallback={<Spinner size="lg" />}>
        <Verify2FAContent />
      </Suspense>
    </AuthLayout>
  );
}
