// src/components/chatroom/session/tabs/RewardsTab.tsx
'use client';

import RewardsPanel from '../RewardsPanel';

interface RewardsTabProps {
  isHost: boolean;
}

export default function RewardsTab({ isHost }: RewardsTabProps) {
  return (
    <RewardsPanel isTeacher={isHost} />
  );
}
