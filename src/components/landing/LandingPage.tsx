// src/components/landing/LandingPage.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '@/lib/redux/slices/authSlice';
import Image from 'next/image';
import PublicAnnouncements from './PublicAnnouncements'; // Import the new component

export default function LandingPage() {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser);
    const locale = 'fr'; // App is French-only now

    return (
        <div 
            className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat p-8"
            style={{ backgroundImage: "url('/images/riadh5.jpg')" }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 z-0" />
            
            <main className="relative z-10 flex flex-1 flex-col items-center justify-center text-center text-white space-y-12">
                <div className="mb-4">
                    <div className="inline-block mb-4">
                        <Image 
                            src="/logo.png" 
                            alt="Logo College Riadh 5" 
                            width={80} 
                            height={80} 
                            priority
                            data-ai-hint="school logo"
                        />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold font-headline text-white">
                        Bienvenue à <span className="text-primary">College Riadh 5</span>
                    </h1>
                </div>

                {/* Replace the role carousel with the new announcements component */}
                <PublicAnnouncements />

                <div className="space-y-4">
                  {isAuthenticated && currentUser ? (
                      <Button asChild size="lg" className="text-lg py-6 px-8">
                          <Link href={`/${locale}/${currentUser.role.toLowerCase()}`}>Accéder à mon tableau de bord</Link>
                      </Button>
                  ) : (
                      <Button asChild size="lg" className="text-lg py-6 px-8">
                          <Link href={`/${locale}/login`}>Commencer</Link>
                      </Button>
                  )}
                  <p className="text-xs text-neutral-300">© {new Date().getFullYear()} AHMED ABBES. Tous droits réservés.</p>
                </div>
            </main>
        </div>
    );
}
