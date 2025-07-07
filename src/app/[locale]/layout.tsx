// src/app/[locale]/layout.tsx
import type { ReactNode } from 'react';

// This layout is now just a pass-through since Providers are in the root layout.
export default function LocaleLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
