
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Hand, HandMetal } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { raiseHand, lowerHand } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

interface RaiseHandButtonProps {
  studentId: string;
  studentName: string;
}

export default function RaiseHandButton({ studentId, studentName }: RaiseHandButtonProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);
  
  if (!activeSession) {
    return null;
  }

  const participant = activeSession.participants.find(p => p.id === studentId);
  const hasRaisedHand = participant?.hasRaisedHand || false;
  const position = activeSession.raisedHands.indexOf(studentId) + 1;

  const handleToggleHand = () => {
    if (hasRaisedHand) {
      dispatch(lowerHand(studentId));
      dispatch(addNotification({
        type: 'hand_lowered',
        title: 'Main baissée',
        message: 'Vous avez baissé la main',
      }));
    } else {
      dispatch(raiseHand(studentId));
      dispatch(addNotification({
        type: 'hand_raised',
        title: 'Main levée',
        message: 'Votre main a été levée. Le professeur a été notifié.',
      }));
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={handleToggleHand}
        variant={hasRaisedHand ? "default" : "outline"}
        size="lg"
        className={`relative transition-all duration-200 ${
          hasRaisedHand 
            ? "bg-orange-500 hover:bg-orange-600 text-white animate-pulse" 
            : "hover:bg-orange-50 hover:border-orange-300"
        }`}
      >
        {hasRaisedHand ? (
          <HandMetal className="w-6 h-6" />
        ) : (
          <Hand className="w-6 h-6" />
        )}
        <span className="ml-2">
          {hasRaisedHand ? "Baisser la main" : "Lever la main"}
        </span>
      </Button>
      
      {hasRaisedHand && position > 0 && (
        <div className="text-xs text-gray-500 bg-orange-100 px-2 py-1 rounded-full">
          Position #{position} dans la file
        </div>
      )}
    </div>
  );
}

    