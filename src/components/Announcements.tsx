import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-utils";
import { Role, type AnnouncementWithClass } from "@/types/index"; 
import type { Prisma } from "@prisma/client";
import Link from 'next/link';
import Image from "next/image";
import { FileText } from "lucide-react";

const Announcements = async () => {
  const session = await getServerSession();
  const userRole = session?.role as Role | undefined; 
  const currentUserId = session?.userId;

  const queryOptions: Prisma.AnnouncementFindManyArgs = {
    orderBy: { date: "desc" },
    include: { class: { select: { name: true } } } 
  };

  if (userRole && currentUserId && userRole !== Role.ADMIN) {
    const roleConditions: Prisma.AnnouncementWhereInput = {};
    if (userRole === Role.TEACHER) {
      // A teacher sees announcements for classes they teach in.
      roleConditions.class = { lessons: { some: { teacherId: currentUserId } } };
    } else if (userRole === Role.STUDENT) {
      roleConditions.class = { students: { some: { id: currentUserId } } };
    } else if (userRole === Role.PARENT) {
      roleConditions.class = { students: { some: { parentId: currentUserId } } };
    }
    
    // All roles should see announcements for everyone (classId is null) OR announcements for their specific classes.
    queryOptions.where = {
        OR: [
          { classId: null }, 
          roleConditions
        ].filter(condition => Object.keys(condition).length > 0) 
    };
  }

  const data: AnnouncementWithClass[] = await prisma.announcement.findMany(queryOptions) as AnnouncementWithClass[];

  if (!data || data.length === 0) {
    return (
      <div className="bg-muted p-4 rounded-md h-full flex flex-col items-center justify-center">
        <h1 className="text-xl font-semibold mb-4 self-start">Annonces</h1>
        <p className="text-sm text-gray-400">Pas d'annonces pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-muted p-4 rounded-md h-[600px] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-xl font-semibold">Annonces</h1>
      </div>
      <div className="flex-grow mt-4 pr-2 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-4">
          {data.map((announcement, index) => {
            const cardColors = ["bg-lamaSkyLight", "bg-lamaPurpleLight", "bg-lamaYellowLight"];
            const cardColor = cardColors[index % cardColors.length];

            let content;
            try {
              const fileInfo = JSON.parse(announcement.description || '{}');
              
              if (fileInfo.files && Array.isArray(fileInfo.files) && fileInfo.files.length > 0) {
                if (fileInfo.files.length > 1) {
                  // --- Gallery View (Vertical Stack) ---
                  content = (
                    <div className="mt-2 space-y-2">
                        {fileInfo.files.map((file: any, idx: number) => (
                          <Link key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full relative aspect-[4/3] rounded-md overflow-hidden group bg-muted/50">
                                <Image
                                    src={file.url}
                                    alt={`${announcement.title} - image ${idx + 1}`}
                                    fill
                                    sizes="300px"
                                    style={{ objectFit: 'contain' }}
                                    className="group-hover:opacity-80 transition-opacity"
                                />
                            </Link>
                        ))}
                    </div>
                  );
                } else {
                  // --- Single File View (from new format) ---
                  const file = fileInfo.files[0];
                  const fileType = file.type === 'raw' ? 'pdf' : file.type;
                  if (fileType === 'image') {
                    content = (
                      <Link href={file.url} target="_blank" rel="noopener noreferrer" className="mt-2 block w-full relative aspect-video overflow-hidden rounded-md group-hover:opacity-90 transition-opacity bg-muted/50">
                        <Image 
                          src={file.url} 
                          alt={announcement.title} 
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw" 
                          className="object-contain"
                        />
                      </Link>
                    );
                  } else {
                    content = (
                      <Link href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline mt-1">
                        <FileText className="h-4 w-4"/>
                        <span>Voir le document</span>
                      </Link>
                    );
                  }
                }
              } else if (fileInfo.fileUrl && fileInfo.fileType) {
                  // --- Legacy Single File View ---
                  const fileType = fileInfo.fileType === 'raw' ? 'pdf' : fileInfo.fileType;
                  if (fileType === 'image') {
                    content = (
                      <Link href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block w-full relative aspect-video overflow-hidden rounded-md group-hover:opacity-90 transition-opacity bg-muted/50">
                        <Image 
                          src={fileInfo.fileUrl} 
                          alt={announcement.title} 
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw" 
                          className="object-contain" 
                        />
                      </Link>
                    );
                  } else {
                     content = (
                      <Link href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline mt-1">
                        <FileText className="h-4 w-4"/>
                        <span>Voir le document</span>
                      </Link>
                    );
                  }
              } else {
                content = <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">{announcement.description}</p>;
              }
            } catch (e) {
              content = <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">{announcement.description}</p>;
            }

           return (
             <div className={`${cardColor} rounded-md p-4 group`} key={announcement.id}>
               <div className="flex items-center justify-between">
                 <h2 className="font-medium">{announcement.title}</h2>
                 <span className="text-xs text-gray-500 bg-background rounded-md px-1 py-1">
                   {new Intl.DateTimeFormat("fr-FR").format(new Date(announcement.date))}
                 </span>
               </div>
               {content}
               {announcement.class && <p className="text-xs text-gray-500 mt-1">Pour: Classe {announcement.class.name}</p>}
               {!announcement.class && <p className="text-xs text-gray-500 mt-1">Pour: Tous</p>}
             </div>
           );
         })}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
