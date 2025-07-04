// src/components/chatroom/session/SessionRoom.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { updateStudentPresence, tickTimer, breakoutTimerTick, endSession, type ActiveSession } from '@/lib/redux/slices/sessionSlice';
import { addSessionReport, type SessionReport } from '@/lib/redux/slices/reportSlice';
import TimerDisplay from './TimerDisplay';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { useToast } from "@/hooks/use-toast";

// Import session components
import OverviewTab from './tabs/OverviewTab';
import SessionSidebar from './SessionSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';

// New components for screen sharing and whiteboard
import HostToolbar from './HostToolbar';
import ScreenShareView from './ScreenShareView';
import Whiteboard from './Whiteboard';
import BreakoutRoomView from './BreakoutRoomView';

interface SessionRoomProps {
    onEndSession: () => void;
}

export type ViewMode = 'grid' | 'screenShare' | 'whiteboard';

export default function SessionRoom({ onEndSession }: SessionRoomProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { activeSession } = useAppSelector(state => state.session);
  const user = useAppSelector(selectCurrentUser);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Simulate student presence updates
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      activeSession.participants.forEach(participant => {
        if (participant.role === 'admin') return; 
        const shouldUpdate = Math.random() < 0.1;
        if (shouldUpdate) {
          dispatch(updateStudentPresence({
            studentId: participant.id,
            isOnline: Math.random() > 0.2,
          }));
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSession, dispatch]);

  // Timer tick effect for main class timer
  useEffect(() => {
    if (!activeSession?.classTimer?.isActive || activeSession.classTimer.remaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      dispatch(tickTimer());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.classTimer?.isActive, activeSession?.classTimer?.remaining, dispatch]);
  
  // Timer tick effect for breakout rooms
  useEffect(() => {
      if (!activeSession?.breakoutTimer || activeSession.breakoutTimer.remaining <= 0) {
          return;
      }
      const interval = setInterval(() => {
          dispatch(breakoutTimerTick());
      }, 1000);

      return () => clearInterval(interval);
  }, [activeSession?.breakoutTimer, dispatch]);

  const handleStartScreenShare = async () => {
    if (screenStream) {
      // If already sharing, just switch view
      setViewMode('screenShare');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      // Listen for the user stopping the share from the browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        handleStopScreenShare();
      });
      setScreenStream(stream);
      setViewMode('screenShare');
    } catch (error) {
      console.error("Erreur lors du démarrage du partage d'écran:", error);
      toast({
          variant: 'destructive',
          title: 'Partage d\'écran annulé',
          description: "La permission de partager l'écran a été refusée ou une erreur est survenue."
      });
    }
  };

  const handleStopScreenShare = () => {
    screenStream?.getTracks().forEach(track => track.stop());
    setScreenStream(null);
    setViewMode('grid');
  };
  
  if (!activeSession || !user) {
    return <div>Chargement de la session...</div>;
  }
  
  const currentUserParticipant = activeSession.participants.find(p => p.id === user.id);
  const isHost = 
    (user?.role === 'TEACHER' && activeSession.sessionType === 'class') ||
    (user?.role === 'ADMIN' && activeSession.sessionType === 'meeting');

  const isParticipant = activeSession.participants.some(p => p.id === user?.id);

  if (!isHost && !isParticipant) {
      return <div>Accès non autorisé à cette session.</div>
  }

  // If user is in a breakout room, show that view
  if (currentUserParticipant?.breakoutRoomId) {
    return <BreakoutRoomView user={user} />;
  }
  
  const renderMainContent = () => {
    switch(viewMode) {
        case 'screenShare':
            return screenStream ? (
                <ScreenShareView stream={screenStream} onStopSharing={handleStopScreenShare} />
            ) : (
                <div className="text-center p-8">Le flux de partage d'écran n'est pas disponible. Veuillez réessayer.</div>
            );
        case 'whiteboard':
            return <Whiteboard />;
        case 'grid':
        default:
            return <OverviewTab activeSession={activeSession} user={user} />;
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
              {isHost && (
                  <HostToolbar
                      viewMode={viewMode}
                      onSetViewMode={setViewMode}
                      onStartScreenShare={handleStartScreenShare}
                  />
              )}
              <div className="flex-1 min-h-0">
                  {renderMainContent()}
              </div>
          </main>
          
          <aside className="w-[400px] border-l bg-background p-4 flex flex-col gap-4">
             <div className="flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold">{activeSession.className}</h2>
                    <TimerDisplay />
                </div>
                {isHost && (
                    <Button size="sm" variant="destructive" onClick={onEndSession}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Terminer
                    </Button>
                )}
             </div>
             <ScrollArea className="flex-1">
                <SessionSidebar isHost={isHost} user={user} />
             </ScrollArea>
          </aside>
      </div>
    </div>
  );
}
