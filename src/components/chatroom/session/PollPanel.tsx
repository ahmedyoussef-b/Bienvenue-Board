
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, Users, Clock, CheckCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { votePoll, endPoll } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

interface PollPanelProps {
  studentId?: string;
  studentName?: string;
  isTeacher?: boolean;
}

export default function PollPanel({ studentId, studentName, isTeacher = false }: PollPanelProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);

  if (!activeSession) {
    return null;
  }

  const { activePoll, polls } = activeSession;

  const handleVote = (optionId: string) => {
    if (!activePoll || !studentId) return;
    
    dispatch(votePoll({
      pollId: activePoll.id,
      optionId,
      studentId,
    }));

    const option = activePoll.options.find(o => o.id === optionId);
    dispatch(addNotification({
      type: 'reaction_sent',
      title: 'Vote enregistré',
      message: `Vous avez voté pour: ${option?.text}`,
    }));
  };

  const handleEndPoll = () => {
    if (!activePoll) return;
    
    dispatch(endPoll(activePoll.id));
    dispatch(addNotification({
      type: 'session_ended',
      title: 'Sondage terminé',
      message: `Le sondage "${activePoll.question}" a été fermé`,
    }));
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(dateString).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}min`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    }
  };

  const getStudentVote = (poll: any) => {
    if (!studentId) return null;
    return poll.options.find((option: any) => option.votes.includes(studentId));
  };

  const studentVote = activePoll ? getStudentVote(activePoll) : null;

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">Sondages</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {polls.length} sondage{polls.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <CardDescription>
          {activePoll 
            ? "Sondage en cours - Votez maintenant !"
            : "Aucun sondage actif actuellement"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Active Poll */}
        {activePoll && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-medium text-lg mb-3">{activePoll.question}</h3>
              
              <div className="space-y-3">
                {activePoll.options.map((option) => {
                  const percentage = activePoll.totalVotes > 0 
                    ? (option.votes.length / activePoll.totalVotes) * 100 
                    : 0;
                  const isVoted = studentVote?.id === option.id;
                  
                  return (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{option.text}</span>
                        <div className="flex items-center gap-2">
                          {isVoted && <CheckCircle className="w-4 h-4 text-green-500" />}
                          <span className="text-sm text-gray-500">
                            {option.votes.length} vote{option.votes.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      {!isTeacher && !studentVote && studentId && (
                        <Button
                          onClick={() => handleVote(option.id)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Voter pour cette option
                        </Button>
                      )}
                      
                      {(isTeacher || studentVote) && (
                        <div className="space-y-1">
                          <Progress value={percentage} className="h-2" />
                          <span className="text-xs text-gray-500">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{activePoll.totalVotes} participant{activePoll.totalVotes !== 1 ? 's' : ''}</span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>{formatTimeAgo(activePoll.createdAt)}</span>
                </div>
                
                {isTeacher && (
                  <Button
                    onClick={handleEndPoll}
                    variant="outline"
                    size="sm"
                  >
                    Terminer
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Poll History */}
        {polls.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Historique des sondages</h4>
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {polls.filter(poll => !poll.isActive).slice(0, 5).map((poll) => (
                  <div
                    key={poll.id}
                    className="p-2 rounded-lg bg-gray-50 text-sm"
                  >
                    <div className="font-medium truncate">{poll.question}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{poll.totalVotes} votes</span>
                      <Clock className="w-3 h-3 ml-1" />
                      <span>{formatTimeAgo(poll.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {polls.length === 0 && (
          <p className="text-center text-gray-500 py-4 text-sm">
            Aucun sondage créé pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
}
