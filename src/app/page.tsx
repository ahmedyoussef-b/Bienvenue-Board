// src/app/page.tsx
export default function RootPage() {
  // This page is never meant to be rendered directly.
  // The middleware handles redirecting to the correct locale (`/fr`).
  // Providing a minimal component satisfies Next.js's requirement for a default export.
  return null;
}
