// src/app/[locale]/(auth)/login/page.tsx
"use client";
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser, selectIsAuthLoading } from '@/lib/redux/slices/authSlice';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import SocialSignInButtons from '@/components/auth/SocialSignInButtons';

export default function LoginPage() {
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

  if (isLoading && !isAuthenticated) { // Adjusted loading state check
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthLayout title="Content de vous revoir !" description="Connectez-vous pour accéder à votre compte.">
        <div className="space-y-6">
            <LoginForm />
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Ou continuer avec
                    </span>
                </div>
            </div>
            <SocialSignInButtons />
        </div>
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
