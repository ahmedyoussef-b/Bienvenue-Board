// src/app/[locale]/(auth)/verify-2fa/page.tsx
"use client";

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectIsAuthLoading } from '@/lib/redux/slices/authSlice';
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
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectIsAuthLoading);

  useEffect(() => {
    // Redirect if the user becomes authenticated
    if (!isLoading && isAuthenticated && currentUser) {
      const rolePath = currentUser.role.toLowerCase();
      router.replace(`/fr/${rolePath}`); 
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  // If the user is already authenticated and somehow lands here, show a redirecting message.
  if (isAuthenticated) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Spinner size="lg" />
          <p className="ml-2">Redirection...</p> 
        </div>
      );
  }

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