// src/components/landing/PublicAnnouncements.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AnnouncementFile {
  url: string;
  type: string;
}

interface PublicAnnouncement {
  id: number;
  title: string;
  date: string;
  files: AnnouncementFile[];
}

export default function PublicAnnouncements() {
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/public-announcements');
        if (!response.ok) throw new Error("Impossible de charger les annonces.");
        const data = await response.json();
        setAnnouncements(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 w-full bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full bg-red-900/50 backdrop-blur-sm rounded-xl p-6 text-white">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h3 className="text-xl font-bold">Erreur de chargement</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
        <div className="w-full max-w-4xl text-center p-8 bg-white/10 backdrop-blur-sm rounded-xl">
            <h2 className="text-2xl font-bold mb-2">Dernières Nouvelles</h2>
            <p className="text-neutral-300">Aucune annonce publique pour le moment. Revenez bientôt !</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Dernières Nouvelles</h2>
        <ScrollArea className="h-80 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-4">
                {announcements.map((ann) => (
                    <Card key={ann.id} className="bg-white/10 backdrop-blur-lg border-white/20 text-white flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">{ann.title}</CardTitle>
                            <p className="text-xs text-neutral-300">
                                Publié le {new Date(ann.date).toLocaleDateString('fr-FR')}
                            </p>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            {ann.files.length > 1 ? (
                                <Badge><ImageIcon className="mr-2" size={14} /> Galerie</Badge>
                            ) : ann.files[0]?.type === 'image' ? (
                                <Badge><ImageIcon className="mr-2" size={14} /> Image</Badge>
                            ) : (
                                <Badge><FileText className="mr-2" size={14} /> Document</Badge>
                            )}
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {ann.files.slice(0, 3).map((file, idx) => (
                                <Link key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-square group">
                                    <Image src={file.url} alt={`${ann.title} - ${idx + 1}`} fill sizes="100px" className="rounded-md object-cover bg-black/20" />
                                </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
    </div>
  );
}
