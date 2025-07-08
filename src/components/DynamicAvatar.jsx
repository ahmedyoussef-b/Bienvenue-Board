// components/DynamicAvatar.jsx
import Image from 'next/image';
import React from 'react';
import { cn } from "@/lib/utils";

/**
 * A component to display a user's avatar, falling back to a generated one.
 * @param {{
 *  seed?: string;
 *  imageUrl?: string | null;
 *  className?: string;
 *  isLCP?: boolean;
 * }} props
 */
const DynamicAvatar = ({ seed = Math.random().toString(36).substring(2), imageUrl = null, className = '', isLCP = false }) => {
  // If an image URL is provided, use it. Otherwise, generate a fallback avatar.
  const finalImageUrl = imageUrl || `https://api.dicebear.com/8.x/avataaars/svg?seed=${seed}`;

  return (
    <Image
      src={finalImageUrl}
      alt="User avatar"
      fill
      sizes="(max-width: 768px) 50vw, 33vw"
      className={cn('object-cover', className)}
      priority={isLCP}
    />
  );
}

export default DynamicAvatar;
