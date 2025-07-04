// src/app/[locale]/layout.tsx
import type { ReactNode } from 'react';
import { Providers } from './Providers';

// This layout is now a Server Component
export default function LocaleLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}
