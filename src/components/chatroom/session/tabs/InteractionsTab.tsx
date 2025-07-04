// src/components/chatroom/session/tabs/InteractionsTab.tsx
'use client';

import HandRaisePanel from '../HandRaisePanel';
import ReactionsPanel from '../ReactionsPanel';
import type { SafeUser } from '@/types';

interface InteractionsTabProps {
  isHost: boolean;
  user: SafeUser | null;
}

export default function InteractionsTab({ isHost, user }: InteractionsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <HandRaisePanel isTeacher={isHost} />
      <ReactionsPanel
        studentId={!isHost ? user?.id : undefined}
        studentName={!isHost ? user?.name : undefined}
        isTeacher={isHost}
      />
    </div>
  );
}
