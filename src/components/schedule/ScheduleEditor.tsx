// src/components/schedule/ScheduleEditor.tsx
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { DndContext, useSensor, useSensors, MouseSensor, TouchSensor, type DragEndEvent } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { addLesson, removeLesson, saveSchedule, selectSchedule, selectScheduleStatus, updateLessonSlot } from '@/lib/redux/features/schedule/scheduleSlice';
import { useToast } from '@/hooks/use-toast';
import type { WizardData, Lesson, Subject, Day } from '@/types';
import TimetableDisplay from './TimetableDisplay';
import { Button } from '../ui/button';
import { ArrowLeft, Loader2, Save, Users, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findConflictingConstraint } from '@/lib/schedule-utils';

type SchedulableLesson = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>;
const formatTimeSimple = (date: string | Date): string => `${new Date(date).getUTCHours().toString().padStart(2, '0')}:00`;

export default function ScheduleEditor({ wizardData, onBackToWizard }: { wizardData: WizardData, onBackToWizard: () => void }) {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const schedule = useAppSelector(selectSchedule);
    const scheduleStatus = useAppSelector(selectScheduleStatus);
    
    const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
    const [selectedClassId, setSelectedClassId] = useState<string>(wizardData.classes[0]?.id.toString() || '');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(wizardData.teachers[0]?.id || '');

    const filteredSchedule = useMemo(() => {
        if (viewMode === 'class' && selectedClassId) return schedule.filter(l => l.classId === parseInt(selectedClassId));
        if (viewMode === 'teacher' && selectedTeacherId) return schedule.filter(l => l.teacherId === selectedTeacherId);
        return [];
    }, [schedule, viewMode, selectedClassId, selectedTeacherId]);

    const handlePlaceLesson = useCallback((subject: Subject, day: Day, time: string) => {
        const { school, teachers, rooms, classes, teacherConstraints = [], subjectRequirements = [] } = wizardData;

        if (viewMode !== 'class' || !selectedClassId) {
             toast({ variant: "destructive", title: "Action impossible", description: "Veuillez sélectionner une classe avant d'ajouter un cours." });
             return;
        }

        const [hour, minute] = time.split(':').map(Number);

        const availableTeacher = teachers.find(teacher => {
            const canTeach = teacher.subjects.some(s => s.id === subject.id);
            if (!canTeach) return false;
            
            const isTeacherBusy = schedule.some(l => l.teacherId === teacher.id && l.day === day && formatTimeSimple(l.startTime) === time);
            if (isTeacherBusy) return false;
            
            const lessonEndTime = new Date(Date.UTC(0, 0, 1, hour, minute + school.sessionDuration));
            const lessonEndTimeStr = `${String(lessonEndTime.getUTCHours()).padStart(2, '0')}:${String(lessonEndTime.getUTCMinutes()).padStart(2, '0')}`;
            const constraint = findConflictingConstraint(teacher.id, day, time, lessonEndTimeStr, teacherConstraints);
            
            return !constraint;
        });

        if (!availableTeacher) {
            toast({ variant: "destructive", title: "Aucun enseignant disponible", description: `Aucun enseignant pour "${subject.name}" n'est libre sur ce créneau.` });
            return;
        }
        
        const subjectReq = subjectRequirements.find(r => r.subjectId === subject.id);
        const occupiedRoomIds = new Set(schedule.filter(l => l.day === day && formatTimeSimple(l.startTime) === time && l.classroomId != null).map(l => l.classroomId!));
        let potentialRooms = rooms.filter(r => !occupiedRoomIds.has(r.id));
        if (subjectReq?.requiredRoomId && subjectReq.requiredRoomId !== 'any') {
            potentialRooms = potentialRooms.filter(r => r.id === subjectReq.requiredRoomId);
        }
        const availableRoom = potentialRooms.length > 0 ? potentialRooms[0] : null;
        
        if (subjectReq?.requiredRoomId && subjectReq.requiredRoomId !== 'any' && !availableRoom) {
            toast({ variant: "destructive", title: "Salle requise occupée", description: `La salle requise pour "${subject.name}" est occupée.` });
            return;
        }

        const newLesson: SchedulableLesson = {
            name: `${subject.name} - ${classes.find(c => c.id === parseInt(selectedClassId, 10))?.name}`,
            day: day,
            startTime: new Date(Date.UTC(2000, 0, 1, hour, minute)).toISOString(),
            endTime: new Date(Date.UTC(2000, 0, 1, hour, minute + school.sessionDuration)).toISOString(),
            subjectId: subject.id,
            classId: parseInt(selectedClassId, 10),
            teacherId: availableTeacher.id,
            classroomId: availableRoom ? availableRoom.id : null,
        };

        dispatch(addLesson(newLesson));
        toast({ title: "Cours ajouté", description: `"${subject.name}" a été ajouté à l'emploi du temps.` });

    }, [wizardData, schedule, selectedClassId, viewMode, dispatch, toast]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;
        
        if (active.id.toString().startsWith('lesson-') && over.id.toString().startsWith('empty-')) {
            const lessonId = parseInt(active.id.toString().replace('lesson-', ''));
            const [, newDay, newTime] = over.id.toString().split('-');

            const lessonToMove = schedule.find(l => l.id === lessonId);
            if (!lessonToMove) return;

            const teacherIsBusy = schedule.some(
                l => l.id !== lessonId && l.teacherId === lessonToMove.teacherId && l.day === newDay && formatTimeSimple(l.startTime).startsWith(newTime)
            );
            if (teacherIsBusy) {
                toast({ variant: "destructive", title: "Conflit d'horaire", description: `L'enseignant(e) est déjà occupé(e) sur ce créneau.` });
                return;
            }

            const classIsBusy = schedule.some(
                l => l.id !== lessonId && l.classId === lessonToMove.classId && l.day === newDay && formatTimeSimple(l.startTime).startsWith(newTime)
            );
            if (classIsBusy) {
                toast({ variant: "destructive", title: "Conflit d'horaire", description: `La classe a déjà un cours sur ce créneau.` });
                return;
            }

            dispatch(updateLessonSlot({ lessonId, newDay: newDay as Day, newTime }));
            toast({ title: "Cours déplacé", description: `Le cours a été déplacé avec succès.` });
        }
    };


    const handleDeleteLesson = (lessonId: number) => dispatch(removeLesson(lessonId));
    const handleSaveChanges = () => dispatch(saveSchedule(schedule as SchedulableLesson[]));

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex flex-col gap-6">
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex-1">
                            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="class"><Users className="mr-2 h-4 w-4" />Par Classe</TabsTrigger>
                                    <TabsTrigger value="teacher"><User className="mr-2 h-4 w-4" />Par Professeur</TabsTrigger>
                                </TabsList>
                                <TabsContent value="class" className="mt-4">
                                    <Label>Classe :</Label>
                                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                        <SelectTrigger className="w-full md:w-72 mt-1"><SelectValue placeholder="Sélectionner une classe..." /></SelectTrigger>
                                        <SelectContent>{wizardData.classes.map(cls => <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </TabsContent>
                                <TabsContent value="teacher" className="mt-4">
                                    <Label>Professeur :</Label>
                                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                        <SelectTrigger className="w-full md:w-72 mt-1"><SelectValue placeholder="Sélectionner un professeur..." /></SelectTrigger>
                                        <SelectContent>{wizardData.teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name} {t.surname}</SelectItem>)}</SelectContent>
                                    </Select>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={onBackToWizard} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Retour</Button>
                            <Button onClick={handleSaveChanges} disabled={scheduleStatus === 'loading'}>
                                {scheduleStatus === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Sauvegarder
                            </Button>
                        </div>
                    </div>
                    <TimetableDisplay 
                        wizardData={wizardData} 
                        scheduleData={filteredSchedule}
                        fullSchedule={schedule}
                        isEditable={true} 
                        onDeleteLesson={handleDeleteLesson}
                        onAddLesson={handlePlaceLesson}
                        viewMode={viewMode}
                        selectedViewId={viewMode === 'class' ? selectedClassId : selectedTeacherId}
                    />
                </div>
            </div>
        </DndContext>
    );
}