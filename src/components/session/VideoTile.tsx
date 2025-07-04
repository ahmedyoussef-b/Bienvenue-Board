
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Video, VideoOff, Mic, MicOff, Hand, Crown, Trophy, Award } from 'lucide-react';

interface VideoTileProps {
  name: string;
  isOnline: boolean;
  isTeacher?: boolean;
  hasRaisedHand?: boolean;
  points?: number;
  badgeCount?: number;
}

export default function VideoTile({ 
  name, 
  isOnline, 
  isTeacher = false, 
  hasRaisedHand = false,
  points = 0,
  badgeCount = 0
}: VideoTileProps) {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankIcon = () => {
    if (!points || points === 0) return null;
    
    if (points >= 50) return <Crown className="w-3 h-3 text-yellow-500" />;
    if (points >= 30) return <Trophy className="w-3 h-3 text-orange-500" />;
    if (points >= 10) return <Award className="w-3 h-3 text-blue-500" />;
    return null;
  };

  return (
    <Card className={`relative overflow-hidden transition-all ${
      hasRaisedHand ? 'ring-2 ring-blue-500 ring-opacity-75' : ''
    } ${!isOnline ? 'opacity-60' : ''}`}>
      <CardContent className="p-3">
        {/* Status Indicators */}
        <div className="absolute top-2 right-2 flex gap-1">
          {hasRaisedHand && (
            <Badge variant="secondary" className="p-1 bg-blue-500 hover:bg-blue-600">
              <Hand className="w-3 h-3 text-white" />
            </Badge>
          )}
        </div>

        {/* Video/Avatar Area */}
        <div className="aspect-video bg-gray-900 rounded-lg mb-3 flex items-center justify-center relative">
          <Avatar className="w-16 h-16">
            <AvatarFallback className={`text-lg font-semibold ${
              isTeacher ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          
          {/* Video Controls */}
          <div className="absolute bottom-2 left-2 flex gap-1">
            <Badge variant="secondary" className="p-1">
              {Math.random() > 0.3 ? (
                <Video className="w-3 h-3" />
              ) : (
                <VideoOff className="w-3 h-3" />
              )}
            </Badge>
            <Badge variant="secondary" className="p-1">
              {Math.random() > 0.2 ? (
                <Mic className="w-3 h-3" />
              ) : (
                <MicOff className="w-3 h-3" />
              )}
            </Badge>
          </div>

          {/* Online Status */}
          <div className={`absolute top-2 left-2 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>

        {/* Name and Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm truncate">{name}</p>
            {isTeacher && (
              <Badge variant="outline" className="text-xs">
                Prof
              </Badge>
            )}
          </div>

          {/* Points and Badges for Students */}
          {!isTeacher && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                {getRankIcon()}
                <span className="font-medium">{points} pts</span>
              </div>
              {badgeCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {badgeCount} 🏆
                </Badge>
              )}
            </div>
          )}

          {/* Status */}
          <p className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

    