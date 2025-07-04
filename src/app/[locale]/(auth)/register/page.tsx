// src/app/[locale]/(auth)/register/page.tsx
"use client";
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectIsAuthLoading } from '@/lib/redux/slices/authSlice';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';

export default function RegisterPage() {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectIsAuthLoading);

  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
      const rolePath = currentUser.role.toLowerCase();
      router.replace(`/fr/${rolePath}`); 
    }
  }, [isLoading, isAuthenticated, currentUser, router]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout title="Créer un compte" description="Rejoignez notre plateforme pour commencer.">
        <RegisterForm />
      </AuthLayout>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Spinner size="lg" />
      <p className="ml-2">Redirection...</p> 
    </div>
  );
}
