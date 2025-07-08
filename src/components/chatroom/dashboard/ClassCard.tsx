'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, UserCheck } from 'lucide-react';
import type { ClassRoom } from '@/lib/redux/slices/session/types';

interface ClassCardProps {
  classroom: ClassRoom;
  onSelect: (classroom: ClassRoom) => void;
}

export default function ClassCard({ classroom, onSelect }: ClassCardProps) {
  const onlineStudents = classroom.students.filter(s => s.isOnline).length;
  const totalStudents = classroom.students.length;

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500 bg-gradient-to-r from-white to-blue-50/30`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {classroom.name}
          </CardTitle>
          <Badge variant={onlineStudents > 0 ? "default" : "secondary"} className="bg-green-100 text-green-800">
            {onlineStudents} en ligne
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{totalStudents} élèves</span>
            </div>
            <div className="flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-green-600" />
              <span>{onlineStudents} connectés</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {classroom.students.slice(0, 6).map((student) => (
              <div
                key={student.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  student.isOnline 
                    ? 'bg-green-100 text-green-800 ring-2 ring-green-500' 
                    : 'bg-gray-100 text-gray-500'
                }`}
                title={student.name}
              >
                {student.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {classroom.students.length > 6 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                +{classroom.students.length - 6}
              </div>
            )}
          </div>
          
          <Button
            onClick={() => onSelect(classroom)}
            className="w-full transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Gérer cette classe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
