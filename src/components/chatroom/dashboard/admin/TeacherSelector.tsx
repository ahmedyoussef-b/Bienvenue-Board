'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { toggleTeacherSelection } from '@/lib/redux/slices/sessionSlice';
import type { SessionParticipant } from '@/lib/redux/slices/session/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TeacherSelectorProps {
  teachers: SessionParticipant[];
}

export default function TeacherSelector({ teachers }: TeacherSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useAppDispatch();
  const { selectedTeachers } = useAppSelector(state => state.session);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTeacherToggle = (teacherId: string) => {
    dispatch(toggleTeacherSelection(teacherId));
  };

  return (
    <div className="space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un professeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
        </div>
        
        <ScrollArea className="h-96">
            <div className="space-y-3 pr-4">
            {filteredTeachers.map((teacher) => {
              const isSelected = selectedTeachers.includes(teacher.id);
              const isDisabled = !teacher.isOnline;

              return (
              <div
                key={teacher.id}
                onClick={() => !isDisabled && handleTeacherToggle(teacher.id)}
                className={cn(
                  "flex items-center space-x-4 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                  isDisabled 
                    ? "bg-muted/50 border-transparent opacity-60" 
                    : "bg-card hover:bg-muted/50",
                  isSelected && "border-primary bg-primary/10"
                )}
              >
                <Checkbox
                  id={`teacher-${teacher.id}`}
                  checked={isSelected}
                  onCheckedChange={() => handleTeacherToggle(teacher.id)}
                  disabled={isDisabled}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <img
                      src={teacher.img || `https://api.dicebear.com/8.x/avataaars/svg?seed=${teacher.name}`}
                      alt={teacher.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-foreground">{teacher.name}</p>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge
                    variant={teacher.isOnline ? "default" : "secondary"}
                    className={cn(
                      "flex items-center gap-1.5",
                      teacher.isOnline && "bg-green-500 hover:bg-green-600"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", teacher.isOnline ? "bg-white/80" : "bg-muted-foreground")} />
                    {teacher.isOnline ? "En ligne" : "Hors ligne"}
                  </Badge>
                </div>
              </div>
              )
            })}
            
            {filteredTeachers.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4" />
                <p>Aucun professeur trouvé</p>
              </div>
            )}
          </div>
        </ScrollArea>
    </div>
  );
}
