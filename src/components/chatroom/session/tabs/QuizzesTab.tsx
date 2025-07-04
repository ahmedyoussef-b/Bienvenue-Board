// src/components/chatroom/session/tabs/QuizzesTab.tsx
'use client';

import QuizPanel from '../QuizPanel';
import type { SessionParticipant } from '@/lib/redux/slices/sessionSlice';

interface QuizzesTabProps {
  currentUserParticipant: SessionParticipant | undefined;
  isHost: boolean;
}

export default function QuizzesTab({ currentUserParticipant, isHost }: QuizzesTabProps) {
  return (
    <QuizPanel
      studentId={currentUserParticipant?.id}
      studentName={currentUserParticipant?.name}
      isTeacher={isHost}
    />
  );
}
