// src/components/landing/RoleCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
}

const RoleCard: React.FC<RoleCardProps> = ({ title, description, icon: Icon, className }) => {
  return (
    <div className={cn("group h-80 w-64 [perspective:1000px]", className)}>
        <div className="relative h-full w-full rounded-xl shadow-xl transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
            {/* Front */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white p-6 text-center [backface-visibility:hidden]">
                <Icon className="w-16 h-16 text-primary mb-4" />
                <h3 className="text-2xl font-bold">{title}</h3>
            </div>
            {/* Back */}
            <div className="absolute inset-0 h-full w-full rounded-xl bg-primary text-primary-foreground p-6 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                <div className="flex min-h-full flex-col items-center justify-center">
                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    <p className="text-sm">{description}</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RoleCard;
