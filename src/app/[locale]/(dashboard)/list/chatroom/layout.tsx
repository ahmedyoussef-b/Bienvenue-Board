
import { Toaster as Sonner } from '@/components/ui/sonner';

export default function ChatroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Sonner />
    </>
  );
}
