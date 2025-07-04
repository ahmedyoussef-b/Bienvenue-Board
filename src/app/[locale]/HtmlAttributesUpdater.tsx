// src/app/[locale]/HtmlAttributesUpdater.tsx
'use client';

import { useEffect } from 'react';

interface HtmlAttributesUpdaterProps {
  lang: string;
  dir: string;
  bodyClassName: string;
}

export default function HtmlAttributesUpdater({ lang, dir, bodyClassName }: HtmlAttributesUpdaterProps) {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    
    // Set body class - theme provider handles theme class on <html>
    // Clear previous font classes to avoid accumulation if bodyClassName changes
    const bodyClasses = document.body.className.split(' ').filter(cls => !cls.startsWith('font-'));
    document.body.className = [...bodyClasses, bodyClassName].join(' ');

  }, [lang, dir, bodyClassName]);

  return null; // This component doesn't render anything itself
}
