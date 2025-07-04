// src/app/[locale]/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsAuthLoading, selectCurrentUser } from '@/lib/redux/slices/authSlice';
import LandingPage from '@/components/landing/LandingPage'; // Import the new component

export default function HomePage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoadingAuth = useSelector(selectIsAuthLoading);
  const currentUser = useSelector(selectCurrentUser);
  const router = useRouter();

  useEffect(() => {
    // This effect only handles the redirect for already-authenticated users.
    // The component will render the landing page for unauthenticated users.
    if (!isLoadingAuth) {
      if (isAuthenticated && currentUser) {
        const rolePath = currentUser.role.toLowerCase();
        router.replace(`/fr/${rolePath}`); 
      }
    }
  }, [isAuthenticated, isLoadingAuth, currentUser, router]);

  // If we're still checking authentication, show a loader.
  if (isLoadingAuth) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Spinner size="lg" />
          <p className="ml-4 text-lg text-muted-foreground font-headline mt-4">
            Chargement de l'application...
          </p>
        </div>
      );
  }

  // If the user is authenticated, they will be redirected by the useEffect.
  // We can show a redirecting message while that happens.
  if (isAuthenticated) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <Spinner size="lg" />
          <p className="ml-4 text-lg text-muted-foreground font-headline mt-4">
            Redirection...
          </p>
        </div>
      );
  }
  
  // If not loading and not authenticated, show the landing page.
  return <LandingPage />;
}
