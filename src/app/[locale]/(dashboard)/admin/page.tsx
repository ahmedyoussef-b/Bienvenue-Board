// src/app/[locale]/(dashboard)/admin/page.tsx
import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Role as AppRole } from "@/types";

// Import the new components
import AdminHeader from '@/components/dashboard/admin/AdminHeader';
import AdminActionCards from '@/components/dashboard/admin/AdminActionCards';
import AdminStatsGrid from '@/components/dashboard/admin/AdminStatsGrid';
import AdminSidebar from '@/components/dashboard/admin/AdminSidebar';

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | string[] | undefined };
}) => {
  const locale = 'fr';
  let session;
  try {
    session = await getServerSession();
  } catch (error) {
    console.error("👑 AdminPage: Erreur critique lors de l'appel à getServerSession:", error);
    redirect(`/${locale}/login`);
    return;
  }

  if (!session || !session.isAuthenticated || session.role !== AppRole.ADMIN) {
    redirect(session && session.isAuthenticated && session.role ? `/${locale}/${(session.role as AppRole).toLowerCase()}` : `/${locale}/login`);
    return;
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <AdminHeader />
      <AdminActionCards locale={locale} />
      
      <div className="flex flex-col lg:flex-row gap-6">
        <AdminStatsGrid />
        <AdminSidebar searchParams={searchParams} />
      </div>
    </div>
  );
};

export default AdminPage;
