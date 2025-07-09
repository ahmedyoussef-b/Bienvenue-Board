// src/app/page.tsx
import { redirect } from 'next/navigation';

// The default and only locale is 'fr' as configured in the i18n middleware.
const defaultLocale = 'fr';

export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
