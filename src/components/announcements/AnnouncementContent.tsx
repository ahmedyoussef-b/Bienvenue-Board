// src/components/announcements/AnnouncementContent.tsx
import Link from 'next/link';
import Image from 'next/image';
import { FileText } from 'lucide-react';
import type { AnnouncementWithClass } from "@/types/index";

interface AnnouncementContentProps {
  announcement: AnnouncementWithClass;
}

const AnnouncementContent: React.FC<AnnouncementContentProps> = ({ announcement }) => {
  try {
    // Attempt to parse the description as JSON
    const fileInfo = JSON.parse(announcement.description || '{}');
    
    // Check for the new multi-file gallery format
    if (fileInfo.files && Array.isArray(fileInfo.files) && fileInfo.files.length > 0) {
      if (fileInfo.files.length > 1) {
        // --- Gallery View (Vertical Stack) ---
        return (
          <div className="max-w-lg space-y-2">
            {fileInfo.files.map((file: any, index: number) => (
              <Link key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full relative aspect-[4/3] rounded-md overflow-hidden group bg-muted/50">
                <Image
                  src={file.url}
                  alt={`${announcement.title} - image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
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
          return (
            <Link href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full max-w-md relative">
              <Image 
                src={file.url} 
                alt={announcement.title} 
                width={800}
                height={1100}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" 
                style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                className="rounded-md hover:opacity-80 transition-opacity" 
              />
            </Link>
          );
        } else {
          return (
            <Link href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
              <FileText className="h-4 w-4"/>
              Voir le document
            </Link>
          );
        }
      }
    } 
    // Check for old single-file format (for backward compatibility)
    else if (fileInfo.fileUrl && fileInfo.fileType) {
        const fileType = fileInfo.fileType === 'raw' ? 'pdf' : fileInfo.fileType;
        if (fileType === 'image') {
          return (
            <Link href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full max-w-md relative">
              <Image 
                src={fileInfo.fileUrl} 
                alt={announcement.title} 
                width={800}
                height={1100}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" 
                style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                className="rounded-md hover:opacity-80 transition-opacity" 
              />
            </Link>
          );
        } else {
          return (
            <Link href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
              <FileText className="h-4 w-4"/>
              Voir le document
            </Link>
          );
        }
    } else {
      // --- Fallback to plain text ---
      return <p className="text-muted-foreground whitespace-pre-wrap break-words">{announcement.description}</p>;
    }
  } catch (e) {
    // If JSON parsing fails, it's a plain text announcement
    return <p className="text-muted-foreground whitespace-pre-wrap break-words">{announcement.description}</p>;
  }
};

export default AnnouncementContent;
