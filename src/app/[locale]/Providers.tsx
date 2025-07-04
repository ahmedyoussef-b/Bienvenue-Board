// src/app/[locale]/Providers.tsx
'use client';

import { StoreProvider } from '../StoreProvider';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <StoreProvider>
        {children}
        <Toaster />
      </StoreProvider>
    </ThemeProvider>
  );
}
