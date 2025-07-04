// src/components/chatroom/session/tabs/ActivitiesTab.tsx
'use client';

import PollPanel from '../PollPanel';
import type { SessionParticipant } from '@/lib/redux/slices/sessionSlice';

interface ActivitiesTabProps {
  currentUserParticipant: SessionParticipant | undefined;
  isHost: boolean;
}

export default function ActivitiesTab({ currentUserParticipant, isHost }: ActivitiesTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <PollPanel
        studentId={currentUserParticipant?.id}
        isTeacher={isHost}
      />
    </div>
  );
}
