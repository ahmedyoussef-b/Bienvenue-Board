// src/app/[locale]/(auth)/layout.tsx
import type React from 'react';

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
