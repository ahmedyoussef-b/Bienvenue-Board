import type React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-primary rounded-full shadow-lg mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key-round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5"/></svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-2 text-sm sm:text-base">{description}</p>}
        </div>
        <div className="bg-background p-6 sm:p-8 rounded-xl shadow-neumorphic">
          {children}
        </div>
        <p className="text-center text-muted-foreground text-xs mt-8">
          &copy; {new Date().getFullYear()} RoleAuthFlow. All rights reserved.
        </p>
      </div>
    </div>
  );
}
