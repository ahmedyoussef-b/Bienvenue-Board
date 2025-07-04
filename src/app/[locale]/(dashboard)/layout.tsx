// src/app/[locale]/(dashboard)/layout.tsx
import Navbar from "@/components/Navbar";
import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import type { Role } from "@/types/index";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = 'fr'; // Locale fixée à 'fr'
  let session;
  try {
    session = await getServerSession();
  } catch (error) {
    console.error("🖼️ DashboardLayout: Erreur critique lors de l'appel à getServerSession:", error);
    redirect(`/${locale}/login`);
    return;
  }

  if (!session || !session.isAuthenticated || !session.role) {
    redirect(`/${locale}/login`);
    return;
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
        <div className="no-print">
          <Navbar />
        </div>
        <main className="flex-grow overflow-y-auto">
         {children}
        </main>
    </div>
  );
}
