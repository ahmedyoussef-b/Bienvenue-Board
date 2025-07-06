// src/components/Menu.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/lib/redux/slices/authSlice";
import { Role } from "@/types/index";
import type { SafeUser } from "@/types";
import { menuItems } from "@/lib/constants"; // Import from constants

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
