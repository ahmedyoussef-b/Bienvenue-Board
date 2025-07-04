// src/app/[locale]/(dashboard)/profile/page.tsx
import { getServerSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import UserProfileClient from "@/components/profile/UserProfileClient";
import type { Teacher, Student, Parent, Admin } from "@/types";

type UserProfile = (Teacher | Student | Parent | Admin) & {
  user: {
    id: string;
    email: string;
    username: string;
    role: Role;
    img: string | null;
  }
};

const ProfilePage = async () => {
  const locale = 'fr';
  const session = await getServerSession();

  if (!session?.userId || !session.role) {
    redirect(`/${locale}/login`);
    return null;
  }

  let userProfile: UserProfile | null = null;
  const includeUser = {
    user: {
      select: { id: true, email: true, username: true, role: true, img: true }
    }
  };

  try {
    switch (session.role) {
      case Role.ADMIN:
        userProfile = await prisma.admin.findUnique({ where: { userId: session.userId }, include: includeUser }) as UserProfile;
        break;
      case Role.TEACHER:
        userProfile = await prisma.teacher.findUnique({ where: { userId: session.userId }, include: includeUser }) as UserProfile;
        break;
      case Role.STUDENT:
        userProfile = await prisma.student.findUnique({ where: { userId: session.userId }, include: includeUser }) as UserProfile;
        break;
      case Role.PARENT:
        userProfile = await prisma.parent.findUnique({ where: { userId: session.userId }, include: includeUser }) as UserProfile;
        break;
      default:
        // Handle VISITOR or other roles if necessary
        break;
    }
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    // Maybe redirect to an error page or show a message
  }

  if (!userProfile) {
    return (
      <div className="p-4 md:p-6 text-center">
        Profil non trouvé. Veuillez contacter l'administration.
      </div>
    );
  }

  return <UserProfileClient userProfile={userProfile} />;
};

export default ProfilePage;
