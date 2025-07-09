// src/components/schedule/TimetableDisplay.tsx
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Printer, Trash2, Building, BookOpen } from 'lucide-react';
import type { WizardData, Lesson, Subject, ClassWithGrade, Classroom } from '@/types';
import { Day } from '@prisma/client';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { updateLessonRoom } from '@/lib/redux/features/schedule/scheduleSlice';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateTimeSlots, mergeConsecutiveLessons, calculateAvailableSlots } from '@/lib/schedule-utils';
import { ScrollArea } from '../ui/scroll-area';
import { dayLabels, subjectColors } from '@/lib/constants';

const formatTimeSimple = (date: string | Date): string => {
    const d = new Date(date);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
};

const timeToMinutes = (time: string): number => {
    if (typeof time !== 'string' || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const getSubjectColorClass = (subjectId: number, subjects: Subject[]): string => {
    if (!subjects || !Array.isArray(subjects)) return 'bg-muted';
    const index = subjects.findIndex((s: Subject) => s.id === subjectId);
    return subjectColors[index % subjectColors.length] || 'bg-muted';
};

// --- Updated Helper Function ---
const getAvailableRoomsForSlot = (
    day: Day,
    timeSlot: string,
    duration: number, // Duration of the lesson/slot in minutes
    wizardData: WizardData,
    fullSchedule: Lesson[],
    lessonToExcludeId: number | null = null
): Classroom[] => {
    console.log('[getAvailableRoomsForSlot] CALLED with:', { day, timeSlot, duration, lessonToExcludeId });

    if (!wizardData?.rooms || !Array.isArray(wizardData.rooms)) {
        console.error('[getAvailableRoomsForSlot] No rooms in wizardData.');
        return [];
    }

    const slotStartMinutes = timeToMinutes(timeSlot);
    const slotEndMinutes = slotStartMinutes + duration;

    console.log(`[getAvailableRoomsForSlot] Checking slot: ${day} from ${slotStartMinutes} to ${slotEndMinutes} mins.`);

    const occupiedRoomIds = new Set<number>();

    fullSchedule.forEach(l => {
        if (l.id === lessonToExcludeId) {
            console.log(`[getAvailableRoomsForSlot] Excluding lesson ID ${lessonToExcludeId} from conflict check.`);
            return;
        }

        if (l.classroomId == null || l.day !== day) {
            return;
        }
        
        const otherStartTime = new Date(l.startTime);
        const otherEndTime = new Date(l.endTime);

        const otherLessonStart = otherStartTime.getUTCHours() * 60 + otherStartTime.getUTCMinutes();
        const otherLessonEnd = otherEndTime.getUTCHours() * 60 + otherEndTime.getUTCMinutes();

        // Check for overlap
        if (slotStartMinutes < otherLessonEnd && slotEndMinutes > otherLessonStart) {
             console.log(`[getAvailableRoomsForSlot] Conflict found for room ID ${l.classroomId}. Lesson "${l.name}" (${otherLessonStart}-${otherLessonEnd}) overlaps with slot ${slotStartMinutes}-${slotEndMinutes}.`);
            occupiedRoomIds.add(l.classroomId);
        }
    });
    
    console.log('[getAvailableRoomsForSlot] Occupied Room IDs for this slot:', Array.from(occupiedRoomIds));

    const availableRooms = wizardData.rooms.filter(room => !occupiedRoomIds.has(room.id));
    
    console.log('[getAvailableRoomsForSlot] RETURNING Available Rooms:', availableRooms.map(r => r.name));

    return availableRooms;
};


// --- Internal Components ---

const RoomSelectorPopover: React.FC<{
  lesson: Lesson | null;
  day: Day;
  timeSlot: string;
  wizardData: WizardData;
  fullSchedule: Lesson[];
}> = ({ lesson, day, timeSlot, wizardData, fullSchedule }) => {
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(false);

    const availableRooms = useMemo(() => {
        console.log('[RoomSelectorPopover] Calculating available rooms for existing lesson:', lesson?.name);
        if (!lesson) return []; // Cannot determine capacity without a lesson/class
        
        const lessonDuration = (new Date(lesson.endTime).getTime() - new Date(lesson.startTime).getTime()) / (1000 * 60);
        
        const allAvailable = getAvailableRoomsForSlot(day, timeSlot, lessonDuration, wizardData, fullSchedule, lesson.id);

        const lessonClass = wizardData.classes.find(c => c.id === lesson.classId);
        const studentCount = lessonClass?._count.students || 0;
        
        const finalRooms = allAvailable.filter(room => room.capacity >= studentCount);
        console.log('[RoomSelectorPopover] Final rooms for this lesson:', finalRooms.map(r => r.name));
        return finalRooms;

    }, [day, timeSlot, fullSchedule, wizardData, lesson]);
    
    const handleRoomChange = (newRoomId: number | null) => {
        if (!lesson) return;
        dispatch(updateLessonRoom({ lessonId: lesson.id, classroomId: newRoomId }));
        toast({ title: "Salle modifiée", description: `Le cours a été assigné à une nouvelle salle.` });
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon" className="absolute top-1 right-1 p-0.5 h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Changer de salle">
                    <Building size={14} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
                 <div className="space-y-2">
                    <h4 className="font-medium leading-none">Salles Disponibles</h4>
                    <p className="text-sm text-muted-foreground">
                        Créneau: {dayLabels[day]} {timeSlot}
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {availableRooms.length > 0 ? availableRooms.map(room => (
                            <Button
                                key={room.id}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => handleRoomChange(room.id)}
                                disabled={!lesson}
                            >
                                {room.name}
                            </Button>
                        )) : <p className="text-sm text-muted-foreground p-2">Aucune salle libre.</p>}
                        
                        {lesson?.classroomId && (
                             <Button
                                variant="destructive"
                                size="sm"
                                className="w-full justify-start mt-2"
                                onClick={() => handleRoomChange(null)}
                            >
                                Retirer la salle
                            </Button>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};


const DraggableLesson = ({ lesson, wizardData, onDelete, isEditable, fullSchedule }: { lesson: Lesson; wizardData: WizardData; onDelete: (id: number) => void; isEditable: boolean; fullSchedule: Lesson[] }) => {
    const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging } = useDraggable({
        id: `lesson-${lesson.id}`,
        data: { lesson },
        disabled: !isEditable,
    });
    const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
        id: `lesson-${lesson.id}`,
        data: { lesson }
    });

    const setNodeRef = (node: HTMLElement | null) => {
        setDraggableNodeRef(node);
        setDroppableNodeRef(node);
    };

    const style = transform ? { 
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 10,
    } : undefined;

    const getSubjectName = (id: number) => wizardData.subjects?.find(s => s.id === id)?.name || 'N/A';
    const getTeacherName = (id: string) => {
        const teacher = wizardData.teachers?.find(t => t.id === id);
        return teacher ? `${teacher.name.charAt(0)}. ${teacher.surname}` : 'N/A';
    };
    const getClassName = (id: number) => wizardData.classes?.find(c => c.id === id)?.name || 'N/A';
    const getRoomName = (id: number | null) => {
      const rooms = wizardData?.rooms ?? [];
      if (!Array.isArray(rooms)) return 'N/A';
      return rooms.find(r => r.id === id)?.abbreviation || rooms.find(r => r.id === id)?.name || 'N/A';
    }
    
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn(`absolute inset-1 p-2 rounded-md border text-xs flex flex-col justify-center transition-colors group cursor-grab`, getSubjectColorClass(lesson.subjectId, wizardData.subjects), isOver && 'ring-2 ring-primary', isDragging && 'opacity-50 shadow-lg')}>
             {isEditable && (
                <>
                    <button
                        onMouseDown={(e) => { e.stopPropagation(); onDelete(lesson.id); }}
                        className="absolute top-0 left-0 p-0.5 bg-destructive/80 text-destructive-foreground rounded-br-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer ce cours"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                    <RoomSelectorPopover lesson={lesson} day={lesson.day} timeSlot={formatTimeSimple(lesson.startTime)} wizardData={wizardData} fullSchedule={fullSchedule} />
                </>
            )}
            <div className="font-semibold text-foreground">{getSubjectName(lesson.subjectId)}</div>
            <div className="text-xs text-muted-foreground">{getTeacherName(lesson.teacherId)}</div>
            <div className="text-xs text-muted-foreground">Cl: {getClassName(lesson.classId)}</div>
            <div className="text-xs text-muted-foreground">Salle: {getRoomName(lesson.classroomId)}</div>
        </div>
    );
};


const InteractiveEmptyCell: React.FC<{
  day: Day;
  timeSlot: string;
  wizardData: WizardData;
  fullSchedule: Lesson[];
  onAddLesson: (subject: Subject, day: Day, timeSlot: string) => void;
  isDropDisabled?: boolean;
  viewMode: 'class' | 'teacher';
  selectedViewId: string;
  setHoveredSubjectId: (id: number | null) => void;
  highlightClass?: string;
}> = ({ day, timeSlot, wizardData, fullSchedule, onAddLesson, isDropDisabled = false, viewMode, selectedViewId, setHoveredSubjectId, highlightClass }) => {
    const { setNodeRef } = useDroppable({
        id: `empty-${day}-${timeSlot}`,
        data: { day, time: timeSlot },
        disabled: isDropDisabled,
    });
    
    const availableRooms = useMemo(() => {
        console.log('[InteractiveEmptyCell] Calculating available rooms for empty slot:', { day, timeSlot });
        const rooms = getAvailableRoomsForSlot(day, timeSlot, wizardData.school.sessionDuration, wizardData, fullSchedule);
        console.log('[InteractiveEmptyCell] Available rooms for empty slot:', { day, timeSlot }, rooms.map(r => r.name));
        return rooms;
    }, [day, timeSlot, wizardData, fullSchedule]);
    
    const availableSubjects = useMemo(() => {
        if (viewMode !== 'class' || !selectedViewId || !wizardData.subjects || !wizardData.school) {
            return [];
        }
        const classIdNum = parseInt(selectedViewId, 10);
        
        const scheduledHoursBySubject = fullSchedule
            .filter(l => l.classId === classIdNum)
            .reduce((acc, l) => {
                acc[l.subjectId] = (acc[l.subjectId] || 0) + 1;
                return acc;
            }, {} as Record<number, number>);

        return wizardData.subjects.filter(subject => {
            const requirement = wizardData.lessonRequirements?.find(r => 
                r.classId === classIdNum && r.subjectId === subject.id
            );
            const requiredHours = requirement ? requirement.hours : (subject.weeklyHours || 0);
            const scheduledHours = scheduledHoursBySubject[subject.id] || 0;
            return scheduledHours < requiredHours;
        });
    }, [fullSchedule, wizardData, selectedViewId, viewMode]);


    return (
        <div ref={setNodeRef} className={cn("h-24 w-full rounded-md transition-colors relative group p-1", highlightClass && `${highlightClass} animate-subtle-pulse`)}>
            <div className="absolute bottom-1 right-1 flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                 {viewMode === 'class' && (
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><BookOpen size={14} /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" onMouseLeave={() => setHoveredSubjectId(null)}>
                            <h4 className="font-medium text-sm mb-2">Matières possibles</h4>
                            <ScrollArea className="max-h-48">
                                <div className="space-y-1">
                                    {availableSubjects.length > 0 ? availableSubjects.map(subject => (
                                        <Button 
                                            key={subject.id} 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full justify-start" 
                                            onClick={() => onAddLesson(subject, day, timeSlot)}
                                            onMouseEnter={() => setHoveredSubjectId(subject.id)}
                                        >
                                            {subject.name}
                                        </Button>
                                    )) : <p className="text-xs text-muted-foreground p-2">Aucune matière avec des heures restantes.</p>}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                 )}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Building size={14} /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                        <h4 className="font-medium text-sm mb-2">Salles libres</h4>
                        <ScrollArea className="max-h-48">
                            <div className="space-y-1">
                                {availableRooms.length > 0 ? availableRooms.map(room => (
                                    <div key={room.id} className="text-sm p-1">{room.name}</div>
                                )) : <p className="text-xs text-muted-foreground p-2">Aucune salle libre.</p>}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};


interface TimetableDisplayProps {
  wizardData: WizardData;
  scheduleData: Lesson[];
  fullSchedule: Lesson[];
  isEditable?: boolean;
  onDeleteLesson?: (lessonId: number) => void;
  onAddLesson?: (subject: Subject, day: Day, timeSlot: string) => void;
  viewMode: 'class' | 'teacher';
  selectedViewId: string | number;
}

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ 
    wizardData, 
    scheduleData, 
    fullSchedule,
    isEditable = false, 
    onDeleteLesson = () => {}, 
    onAddLesson = () => {},
    viewMode,
    selectedViewId,
}) => {
  const schoolDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const timeSlots = useMemo(() => {
    if (!wizardData?.school) return [];
    return generateTimeSlots(
        wizardData.school.startTime, 
        wizardData.school.endTime, 
        wizardData.school.sessionDuration
    );
  }, [wizardData?.school]);

  const dayMapping: { [key: string]: Day } = { Lundi: 'MONDAY', Mardi: 'TUESDAY', Mercredi: 'WEDNESDAY', Jeudi: 'THURSDAY', Vendredi: 'FRIDAY', Samedi: 'SATURDAY' };
  
  const [hoveredSubjectId, setHoveredSubjectId] = useState<number | null>(null);

  const highlightedSlotsMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!hoveredSubjectId || viewMode !== 'class') return map;
    
    const subject = wizardData.subjects.find(s => s.id === hoveredSubjectId);
    if (!subject) return map;
    
    const availableSlotsSet = calculateAvailableSlots(
        subject,
        String(selectedViewId),
        fullSchedule,
        wizardData,
        true // Ignore time preference for manual editing highlights
    );
    
    const colorClass = getSubjectColorClass(hoveredSubjectId, wizardData.subjects);

    availableSlotsSet.forEach(slotKey => {
        map.set(slotKey, colorClass);
    });

    return map;
  }, [hoveredSubjectId, wizardData, fullSchedule, selectedViewId, viewMode]);


  const { scheduleGrid, spannedSlots } = useMemo(() => {
    if (!Array.isArray(scheduleData) || !wizardData || !wizardData.school) return { scheduleGrid: {}, spannedSlots: new Set() };
    const mergedLessons = mergeConsecutiveLessons(scheduleData, wizardData);
    const grid: { [key: string]: { lesson: Lesson, rowSpan: number } } = {};
    const localSpannedSlots = new Set();

    mergedLessons.forEach((lesson) => {
      const day = lesson.day;
      const time = formatTimeSimple(lesson.startTime);
      const cellId = `${day}-${time}`;

      if (localSpannedSlots.has(cellId)) return;

      const startTime = new Date(lesson.startTime);
      const endTime = new Date(lesson.endTime);
      const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      const rowSpan = Math.max(1, Math.round(durationInMinutes / (wizardData.school?.sessionDuration || 60) ));

      grid[cellId] = { lesson, rowSpan };

      if (rowSpan > 1) {
        for (let i = 1; i < rowSpan; i++) {
          const nextTimeSlotIndex = timeSlots.indexOf(time) + i;
          if (nextTimeSlotIndex < timeSlots.length) {
            const nextTimeSlot = timeSlots[nextTimeSlotIndex];
            localSpannedSlots.add(`${day}-${nextTimeSlot}`);
          }
        }
      }
    });
    return { scheduleGrid: grid, spannedSlots: localSpannedSlots };
  }, [scheduleData, wizardData, timeSlots]);
  
  const exportToPDF = () => { window.print(); };

  return (
    <div className="space-y-6 mt-4 print-container">
       {!isEditable && (
        <Card className="p-6 print:hidden">
            <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                Emplois du Temps - {wizardData?.school?.name ?? 'École'}
                </h2>
                <p className="text-muted-foreground">
                    Consultez l'emploi du temps généré.
                </p>
            </div>
            <div className="flex space-x-3">
                <Button variant="outline" onClick={exportToPDF}><Printer size={16} className="mr-2" />Imprimer</Button>
                <Button variant="outline"><Download size={16} className="mr-2" />Export PDF</Button>
            </div>
            </div>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative w-full overflow-auto">
            <Table className="min-w-full border-collapse">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 border">Horaires</TableHead>
                  {schoolDays.map(day => <TableHead key={day} className="text-center border min-w-32">{day}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSlots.map((time) => (
                  <TableRow key={time}>
                    <TableCell className="font-medium bg-muted/50 border h-24">{time}</TableCell>
                    {schoolDays.map(day => {
                      const dayEnum = dayMapping[day];
                      const cellId = `${dayEnum}-${time}`;

                      if (spannedSlots.has(cellId)) {
                          return null;
                      }

                      const cellData = scheduleGrid[cellId] as Record<string, { lesson: Lesson, rowSpan: number }>[string];
                      const highlightClass = highlightedSlotsMap.get(cellId);
                      
                      if (cellData) {
                          return (
                            <TableCell key={cellId} rowSpan={cellData.rowSpan} className="p-0 border align-top relative">
                               <DraggableLesson lesson={cellData.lesson} wizardData={wizardData} onDelete={onDeleteLesson} isEditable={isEditable} fullSchedule={fullSchedule}/>
                            </TableCell>
                          );
                      } else {
                          return (
                              <TableCell key={cellId} className="p-0 border align-top">
                                  <InteractiveEmptyCell
                                      day={dayEnum}
                                      timeSlot={time}
                                      viewMode={viewMode}
                                      selectedViewId={String(selectedViewId)}
                                      wizardData={wizardData}
                                      fullSchedule={fullSchedule}
                                      onAddLesson={onAddLesson}
                                      isDropDisabled={!isEditable}
                                      setHoveredSubjectId={setHoveredSubjectId}
                                      highlightClass={highlightClass}
                                  />
                              </TableCell>
                          );
                      }
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetableDisplay;
