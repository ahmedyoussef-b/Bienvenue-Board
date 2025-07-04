
// src/components/Menu.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/lib/redux/slices/authSlice";
import { Role } from "@/types/index";
import type { SafeUser } from "@/types";
import { BarChart3 } from 'lucide-react';

const menuItems: Array<{
  title: string;
  items: Array<{
    icon: string;
    label: string;
    href: string;
    visible: Role[]; 
  }>;
}> = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Accueil",
        href: "/", 
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
       {
        icon: "/calendar.png",
        label: "Planificateur",
        href: "/shuddle",
        visible: [Role.ADMIN],
      },
      {
        icon: "/exam.png", // Utilisation d'une icône existante qui ressemble à un rapport
        label: "Rapports",
        href: "/admin/reports",
        visible: [Role.ADMIN],
      },
      {
        icon: "/teacher.png",
        label: "Enseignants",
        href: "/list/teachers",
        visible: [Role.ADMIN, Role.TEACHER],
      },
      {
        icon: "/student.png",
        label: "Étudiants",
        href: "/list/students",
        visible: [Role.ADMIN, Role.TEACHER],
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: [Role.ADMIN, Role.TEACHER],
      },
      {
        icon: "/subject.png",
        label: "Matières",
        href: "/list/subjects",
        visible: [Role.ADMIN],
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classes",
        visible: [Role.ADMIN, Role.TEACHER],
      },
      {
        icon: "/lesson.png",
        label: "Cours",
        href: "/list/lessons",
        visible: [Role.ADMIN, Role.TEACHER], 
      },
      {
        icon: "/exam.png",
        label: "Examens",
        href: "/list/exams",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/assignment.png",
        label: "Devoirs",
        href: "/list/assignments",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/result.png",
        label: "Résultats",
        href: "/list/results",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/attendance.png",
        label: "Présence",
        href: "/list/attendance", 
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/calendar.png",
        label: "Événements",
        href: "/list/events",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/message.png",
        label: "Chatroom",
        href: "/list/chatroom",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT]
      },
       {
        icon: "/mail.png",
        label: "Messages",
        href: "/list/messages",
        visible: [Role.ADMIN, Role.TEACHER, Role.PARENT]
      },
      {
        icon: "/announcement.png",
        label: "Annonces",
        href: "/list/announcements",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
    ],
  },
  {
    title: "AUTRE",
    items: [
      {
        icon: "/profile.png",
        label: "Profil",
        href: "/profile", 
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/setting.png",
        label: "Paramètres",
        href: "/settings", 
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
    ],
  },
];


const Menu = () => {
  const currentUser: SafeUser | null = useSelector(selectCurrentUser);
  const userRole = currentUser?.role;
  const locale = 'fr';

  if (!userRole) {
    return null;
  }

  return (
    <div className="mt-4 text-sm px-2">
      {menuItems.map((group) => (
        <div className="flex flex-col gap-1" key={group.title}>
          <span className="text-sidebar-foreground/70 font-light my-2 px-2 text-xs">
            {group.title}
          </span>
          {group.items.map((item) => {
            if (item.visible.includes(userRole)) {
              const baseHref = item.href === "/" && userRole ? `/${userRole.toLowerCase()}` : item.href;
              const finalHref = `/${locale}${baseHref.startsWith('/') ? '' : '/'}${baseHref}`;
              
              return (
                <Link
                  href={finalHref} 
                  key={item.label}
                  className="flex items-center gap-4 py-2.5 px-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <Image src={item.icon} alt={item.label} width={20} height={20} />
                  <span>{item.label}</span>
                </Link>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
