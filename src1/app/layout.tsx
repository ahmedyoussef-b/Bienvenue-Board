// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Literata } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const literata = Literata({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-literata',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'RoleAuthFlow App',
  description: 'Role-based authentication flow application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" dir="ltr" className={`${inter.variable} ${literata.variable}`} suppressHydrationWarning> 
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
