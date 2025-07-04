// src/components/chatroom/session/SessionSidebar.tsx
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Brain, Gift, Hand, Trophy, Zap } from 'lucide-react';
import TimerControls from './TimerControls';
import CreatePollDialog from './CreatePollDialog';
import CreateQuizDialog from './CreateQuizDialog';
import HandRaisePanel from './HandRaisePanel';
import ReactionsPanel from './ReactionsPanel';
import RewardsPanel from './RewardsPanel';
import PollPanel from './PollPanel';
import QuizPanel from './QuizPanel';
import type { SafeUser } from '@/types';
import { useAppSelector } from "@/hooks/redux-hooks";


interface SessionSidebarProps {
  isHost: boolean;
  user: SafeUser | null;
}

export default function SessionSidebar({ isHost, user }: SessionSidebarProps) {
    const currentUserParticipant = useAppSelector(state => state.session.activeSession?.participants.find(p => p.id === user?.id));
    
    return (
        <Accordion type="multiple" defaultValue={['tools', 'interactions', 'activities', 'rewards']} className="w-full space-y-4">
            {isHost && (
                <AccordionItem value="tools" className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                           <Zap className="w-5 h-5 text-primary"/>
                           <span className="font-semibold">Outils d'animation</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 border-t">
                        <div className="space-y-3">
                            <TimerControls />
                            <CreatePollDialog />
                            <CreateQuizDialog />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}

            <AccordionItem value="interactions" className="border rounded-lg bg-card shadow-sm">
                 <AccordionTrigger className="px-4 py-3 hover:no-underline">
                     <div className="flex items-center gap-2">
                        <Hand className="w-5 h-5 text-primary"/>
                        <span className="font-semibold">Interactions</span>
                     </div>
                 </AccordionTrigger>
                 <AccordionContent className="p-4 border-t space-y-4">
                    <HandRaisePanel isTeacher={isHost} />
                    <ReactionsPanel isTeacher={isHost} studentId={user?.id} studentName={user?.name} />
                 </AccordionContent>
            </AccordionItem>

            <AccordionItem value="activities" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary"/>
                        <span className="font-semibold">Activités</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t space-y-4">
                   <PollPanel isTeacher={isHost} studentId={user?.id} studentName={user?.name} />
                   <QuizPanel isTeacher={isHost} studentId={user?.id} studentName={user?.name} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rewards" className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary"/>
                        <span className="font-semibold">Récompenses</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t space-y-4">
                    <RewardsPanel isTeacher={isHost} />
                </AccordionContent>
            </AccordionItem>

        </Accordion>
    );
}
