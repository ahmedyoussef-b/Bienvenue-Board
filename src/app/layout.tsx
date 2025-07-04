// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'Bienvenue Board',
  description: 'A welcome page with an AI-powered daily quote.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" dir="ltr" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning> 
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
