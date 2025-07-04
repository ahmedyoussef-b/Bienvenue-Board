
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThumbsUp, ThumbsDown, Laugh, Meh, Smile, SmilePlus, Heart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { sendReaction, clearReactions } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

interface ReactionsPanelProps {
  studentId?: string;
  studentName?: string;
  isTeacher?: boolean;
}

const reactionIcons = {
  thumbs_up: ThumbsUp,
  thumbs_down: ThumbsDown,
  laugh: Laugh,
  meh: Meh,
  smile: Smile,
  smile_plus: SmilePlus,
};

const reactionLabels = {
  thumbs_up: 'J\'aime',
  thumbs_down: 'Je n\'aime pas',
  laugh: 'Drôle',
  meh: 'Bof',
  smile: 'Content',
  smile_plus: 'Très content',
};

export default function ReactionsPanel({ studentId, studentName, isTeacher = false }: ReactionsPanelProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);

  if (!activeSession) {
    return null;
  }

  const handleSendReaction = (type: keyof typeof reactionIcons) => {
    if (!studentId || !studentName) return;
    
    dispatch(sendReaction({ studentId, studentName, type }));
    dispatch(addNotification({
      type: 'reaction_sent',
      title: 'Réaction envoyée',
      message: `Vous avez envoyé une réaction: ${reactionLabels[type]}`,
    }));
  };

  const handleClearReactions = () => {
    dispatch(clearReactions());
    dispatch(addNotification({
      type: 'all_hands_cleared',
      title: 'Réactions effacées',
      message: 'Toutes les réactions ont été effacées',
    }));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}min`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    }
  };

  // Count reactions by type
  const reactionCounts = activeSession.reactions.reduce((acc, reaction) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <CardTitle className="text-lg">Réactions</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {activeSession.reactions.length} réaction{activeSession.reactions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <CardDescription>
          Exprimez vos émotions en temps réel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Reaction buttons for students */}
        {!isTeacher && studentId && studentName && (
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(reactionIcons).map(([type, Icon]) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => handleSendReaction(type as keyof typeof reactionIcons)}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{reactionLabels[type as keyof typeof reactionLabels]}</span>
                {reactionCounts[type] > 0 && (
                  <Badge variant="secondary" className="text-xs px-1 min-w-[20px] h-4">
                    {reactionCounts[type]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Reaction counts display for teacher */}
        {isTeacher && (
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(reactionIcons).map(([type, Icon]) => (
              <div
                key={type}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border bg-gray-50"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs text-center">{reactionLabels[type as keyof typeof reactionLabels]}</span>
                <Badge variant="secondary" className="text-xs">
                  {reactionCounts[type] || 0}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Recent reactions list */}
        {activeSession.reactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Réactions récentes</h4>
            <ScrollArea className="max-h-40">
              <div className="space-y-1">
                {activeSession.reactions.slice(0, 10).map((reaction) => {
                  const Icon = reactionIcons[reaction.type];
                  return (
                    <div
                      key={reaction.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3 h-3" />
                        <span className="font-medium">{reaction.studentName}</span>
                        <span className="text-gray-500">{reactionLabels[reaction.type]}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(new Date(reaction.timestamp))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Clear reactions button for teacher */}
        {isTeacher && activeSession.reactions.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleClearReactions}
              variant="outline"
              size="sm"
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Effacer toutes les réactions
            </Button>
          </div>
        )}

        {activeSession.reactions.length === 0 && (
          <p className="text-center text-gray-500 py-4 text-sm">
            Aucune réaction pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
}

    