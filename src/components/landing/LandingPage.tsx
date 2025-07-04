// src/components/landing/LandingPage.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield, User, GraduationCap, Users, GalleryHorizontal } from 'lucide-react';
import RoleCard from './RoleCard';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '@/lib/redux/slices/authSlice';
import Image from 'next/image';

const roles = [
  {
    title: 'Administrateur',
    description: "Gérez les élèves, professeurs, et classes. Générez des emplois du temps optimisés et consultez des rapports détaillés.",
    icon: Shield,
  },
  {
    title: 'Enseignant',
    description: "Gérez vos cours, créez des devoirs et examens, et engagez vos élèves avec des sessions de classe virtuelles interactives via la Chatroom.",
    icon: User,
  },
  {
    title: 'Parent',
    description: "Consultez les emplois du temps, les notes, et les annonces importantes pour tous vos enfants en un seul endroit.",
    icon: Users,
  },
  {
    title: 'Élève',
    description: "Consultez votre emploi du temps, voyez vos devoirs et examens, et participez activement aux cours en ligne.",
    icon: GraduationCap,
  },
  {
    title: 'Visiteur',
    description: "Consultez les annonces publiques et la galerie des événements de l'école. L'administrateur peut mettre à jour ces sections à tout moment.",
    icon: GalleryHorizontal,
  }
];

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
            
            <main className="relative z-10 flex flex-1 flex-col items-center justify-center text-center text-white">
                <div className="mb-12">
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

                <div className="mb-16 w-full h-80">
                    <div className="scene">
                        <div className="carousel">
                            {roles.map((role, index) => (
                                <div key={index} className="carousel__cell">
                                    <RoleCard
                                        title={role.title}
                                        description={role.description}
                                        icon={role.icon}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

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
