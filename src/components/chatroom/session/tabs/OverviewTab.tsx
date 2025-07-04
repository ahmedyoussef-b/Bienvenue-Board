// src/components/chatroom/session/tabs/OverviewTab.tsx
'use client';

import VideoTile from '../VideoTile';
import { Video, UserX, Star } from 'lucide-react';
import type { ActiveSession, SafeUser } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { moveParticipant, toggleMute, toggleSpotlight } from '@/lib/redux/slices/sessionSlice';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BreakoutRoomsManagement from '../BreakoutRoomsManagement';

const DraggableVideoTile = ({ participant, user, isHost }: { participant: any, user: SafeUser | null, isHost: boolean }) => {
    const dispatch = useAppDispatch();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({id: participant.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <VideoTile
              key={participant.id}
              name={participant.id === user?.id ? `${participant.name} (Vous)`: participant.name}
              isOnline={participant.isOnline}
              isTeacher={participant.role === 'teacher' || participant.role === 'admin'}
              hasRaisedHand={participant.hasRaisedHand}
              points={participant.points}
              badgeCount={participant.badges?.length}
              isMuted={participant.isMuted}
              isHost={isHost}
              onToggleMute={() => dispatch(toggleMute(participant.id))}
              onToggleSpotlight={() => dispatch(toggleSpotlight(participant.id))}
              isSpotlighted={false}
            />
        </div>
    );
}

interface OverviewTabProps {
  activeSession: ActiveSession;
  user: SafeUser | null;
}

export default function OverviewTab({ activeSession, user }: OverviewTabProps) {
  const dispatch = useAppDispatch();
  const spotlightedParticipantId = useAppSelector(state => state.session.activeSession?.spotlightedParticipantId);
  const isHost = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const onlineCount = activeSession.participants.filter(p => p.isOnline).length;
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const handleDragEnd = (event: any) => {
    const {active, over} = event;

    if (active.id !== over.id) {
        const oldIndex = activeSession.participants.findIndex(p => p.id === active.id);
        const newIndex = activeSession.participants.findIndex(p => p.id === over.id);
        dispatch(moveParticipant({ fromIndex: oldIndex, toIndex: newIndex }));
    }
  }

  // Host view when breakout rooms are active
  if (isHost && activeSession.breakoutRooms && activeSession.breakoutRooms.length > 0) {
    return <BreakoutRoomsManagement />;
  }

  if (spotlightedParticipantId) {
    const spotlightedParticipant = activeSession.participants.find(p => p.id === spotlightedParticipantId);
    const otherParticipants = activeSession.participants.filter(p => p.id !== spotlightedParticipantId);

    return (
      <div className="flex flex-col h-full gap-4">
        {spotlightedParticipant ? (
          <div className="flex-1 min-h-0">
            <VideoTile
                name={spotlightedParticipant.name}
                isOnline={spotlightedParticipant.isOnline}
                isTeacher={spotlightedParticipant.role === 'teacher' || spotlightedParticipant.role === 'admin'}
                hasRaisedHand={spotlightedParticipant.hasRaisedHand}
                points={spotlightedParticipant.points}
                badgeCount={spotlightedParticipant.badges?.length}
                isMuted={spotlightedParticipant.isMuted}
                isHost={isHost}
                onToggleMute={() => dispatch(toggleMute(spotlightedParticipant.id))}
                onToggleSpotlight={() => dispatch(toggleSpotlight(spotlightedParticipant.id))}
                isSpotlighted={true}
              />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted rounded-lg">
            <UserX className="w-12 h-12 text-muted-foreground"/>
            <p className="ml-4 text-muted-foreground">Participant non trouvé</p>
          </div>
        )}
        <div className="flex-shrink-0">
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {otherParticipants.map(p => (
                <div key={p.id} className="w-48 flex-shrink-0">
                   <VideoTile
                    name={p.name}
                    isOnline={p.isOnline}
                    isTeacher={p.role === 'teacher' || p.role === 'admin'}
                    hasRaisedHand={p.hasRaisedHand}
                    points={p.points}
                    badgeCount={p.badges?.length}
                    isMuted={p.isMuted}
                    isHost={isHost}
                    onToggleMute={() => dispatch(toggleMute(p.id))}
                    onToggleSpotlight={() => dispatch(toggleSpotlight(p.id))}
                    isSpotlighted={false}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={activeSession.participants.map(p => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeSession.participants.map((participant) => (
              <DraggableVideoTile key={participant.id} participant={participant} user={user} isHost={isHost} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
