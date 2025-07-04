
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Award, Star, Users, Gift, Plus, Medal, Crown, Target, Zap, Heart, BookOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { awardReward } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';

const BADGE_TEMPLATES = [
  { type: 'participation', name: 'Participant actif', description: 'Pour une participation remarquable', icon: '🙋' },
  { type: 'correct_answer', name: 'Expert', description: 'Pour des réponses correctes', icon: '🎯' },
  { type: 'helpful', name: 'Entraide', description: 'Pour avoir aidé ses camarades', icon: '🤝' },
  { type: 'creative', name: 'Créatif', description: 'Pour des idées originales', icon: '💡' },
  { type: 'leader', name: 'Leader', description: 'Pour avoir pris des initiatives', icon: '👑' },
  { type: 'consistent', name: 'Persévérant', description: 'Pour la régularité', icon: '⭐' },
];

interface RewardsPanelProps {
  isTeacher?: boolean;
}

export default function RewardsPanel({ isTeacher = false }: RewardsPanelProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [points, setPoints] = useState('10');
  const [badgeType, setBadgeType] = useState('');
  const [reason, setReason] = useState('');

  if (!activeSession) {
    return null;
  }

  const handleAwardReward = () => {
    if (!selectedStudent || !points || !reason) return;

    const badge = badgeType ? BADGE_TEMPLATES.find(b => b.type === badgeType) : undefined;
    const student = activeSession.participants.find(p => p.id === selectedStudent);

    dispatch(awardReward({
      studentId: selectedStudent,
      points: parseInt(points),
      badge: badge ? {
        type: badge.type as any,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      } : undefined,
      reason,
    }));

    dispatch(addNotification({
      type: 'reaction_sent',
      title: 'Récompense attribuée',
      message: `${student?.name} a reçu ${points} points${badge ? ` et le badge "${badge.name}"` : ''}`,
    }));

    // Reset form
    setSelectedStudent('');
    setPoints('10');
    setBadgeType('');
    setReason('');
    setIsRewardDialogOpen(false);
  };

  const sortedParticipants = [...activeSession.participants].sort((a, b) => {
    const pointsA = a.points || 0;
    const pointsB = b.points || 0;
    return pointsB - pointsA;
  });

  const getTrophyIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Trophy className="w-4 h-4 text-gray-300" />;
    }
  };

  const recentRewards = activeSession.rewardActions?.slice(0, 5) || [];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg">Récompenses</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {activeSession.participants.reduce((total, p) => total + (p.points || 0), 0)} pts
          </Badge>
        </div>
        <CardDescription>
          Classement et badges des élèves
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Award Reward Button for Teachers */}
        {isTeacher && (
          <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Récompenser un élève
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Attribuer une récompense</DialogTitle>
                <DialogDescription>
                  Récompensez un élève pour sa participation ou ses efforts
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="student">Élève</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un élève" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSession.participants.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="mt-1"
                    min="1"
                    max="100"
                  />
                </div>
                
                <div>
                  <Label htmlFor="badge">Badge (optionnel)</Label>
                  <Select value={badgeType} onValueChange={setBadgeType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Aucun badge" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun badge</SelectItem>
                      {BADGE_TEMPLATES.map((badge) => (
                        <SelectItem key={badge.type} value={badge.type}>
                          {badge.icon} {badge.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="reason">Raison</Label>
                  <Textarea
                    id="reason"
                    placeholder="Pourquoi cette récompense ?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsRewardDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleAwardReward}
                  disabled={!selectedStudent || !points || !reason}
                >
                  Attribuer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Leaderboard */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Classement
          </h4>
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {sortedParticipants.map((student, index) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getTrophyIcon(index)}
                    <div>
                      <div className="font-medium text-sm">{student.name}</div>
                      <div className="text-xs text-gray-500">
                        {student.badges?.length || 0} badge{(student.badges?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{student.points || 0}</div>
                    <div className="text-xs text-gray-500">pts</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Recent Rewards */}
        {recentRewards.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Récompenses récentes
            </h4>
            <ScrollArea className="max-h-32">
              <div className="space-y-2">
                {recentRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="p-2 rounded-lg bg-blue-50 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{reward.studentName}</span>
                      <span className="text-blue-600 font-bold">+{reward.points} pts</span>
                    </div>
                    <div className="text-xs text-gray-600">{reward.reason}</div>
                    {reward.badge && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs">{reward.badge.icon}</span>
                        <span className="text-xs font-medium">{reward.badge.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {sortedParticipants.length === 0 && (
          <p className="text-center text-gray-500 py-4 text-sm">
            Aucun participant pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
}

    