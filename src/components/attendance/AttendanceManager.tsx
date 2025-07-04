// src/components/attendance/AttendanceManager.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, User, BookOpen, Check, School, GraduationCap } from 'lucide-react';
import { useCreateAttendanceMutation } from '@/lib/redux/api/entityApi';
import type { Day } from '@prisma/client';

// Types passed from the server component
type StudentData = { id: string; name: string; surname: string };
type ClassData = { id: number; name: string; students: StudentData[] };
type LessonData = { id: number; classId: number; day: Day, startTime: Date, subject: { name: string } };

interface AttendanceManagerProps {
  classes: ClassData[];
  lessons: LessonData[];
}

const dayMapping: { [key: number]: Day } = { 1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY', 0: 'SUNDAY' };

export default function AttendanceManager({ classes, lessons }: AttendanceManagerProps) {
  const { toast } = useToast();
  const [createAttendance, { isLoading }] = useCreateAttendanceMutation();

  const [step, setStep] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  const availableStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return classes.find(c => c.id.toString() === selectedClassId)?.students || [];
  }, [selectedClassId, classes]);

  const availableLessons = useMemo(() => {
    if (!selectedClassId || !selectedDate) return [];
    const dayOfWeek = dayMapping[selectedDate.getDay()];
    if (!dayOfWeek) return [];
    return lessons
      .filter(l => l.classId.toString() === selectedClassId && l.day === dayOfWeek)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [selectedClassId, selectedDate, lessons]);

  const resetForm = () => {
    setStep(1);
    setSelectedClassId('');
    setSelectedStudentId('');
    setSelectedDate(new Date());
    setSelectedLessonId('');
  };

  const handleSave = async () => {
    if (!selectedStudentId || !selectedLessonId || !selectedDate) {
        toast({
            variant: 'destructive',
            title: "Informations manquantes",
            description: "Veuillez compléter toutes les étapes.",
        });
        return;
    }

    try {
        await createAttendance({
            studentId: selectedStudentId,
            lessonId: Number(selectedLessonId),
            date: selectedDate,
            present: false, // Recording an absence
        }).unwrap();

        toast({
            title: 'Absence enregistrée',
            description: `L'absence a été enregistrée avec succès.`,
        });
        resetForm();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Erreur d'enregistrement",
        description: error.data?.message || 'Une erreur est survenue.',
      });
    }
  };

  const formatTime = (date: Date) => {
      return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  
  const selectedClass = classes.find(c => c.id.toString() === selectedClassId);
  const selectedStudent = availableStudents.find(s => s.id === selectedStudentId);
  const selectedLesson = availableLessons.find(l => l.id.toString() === selectedLessonId);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Enregistrer une Absence</CardTitle>
        <CardDescription>Suivez les étapes pour enregistrer une absence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Select Class */}
        <div className="space-y-2">
            <label className="font-semibold flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <School className="w-4 h-4 text-primary" />
                Étape 1: Sélectionner une classe
            </label>
            <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedStudentId(''); setSelectedLessonId(''); setStep(2); }}>
                <SelectTrigger><SelectValue placeholder="Choisir une classe..." /></SelectTrigger>
                <SelectContent>{classes.map(cls => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>)}</SelectContent>
            </Select>
        </div>

        {/* Step 2: Select Student */}
        {step >= 2 && selectedClassId && (
            <div className="space-y-2 animate-in fade-in-0">
                <label className="font-semibold flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Étape 2: Sélectionner l'élève
                </label>
                <Select value={selectedStudentId} onValueChange={(val) => { setSelectedStudentId(val); setSelectedLessonId(''); setStep(3); }}>
                    <SelectTrigger><SelectValue placeholder="Choisir un élève..." /></SelectTrigger>
                    <SelectContent>{availableStudents.map(student => <SelectItem key={student.id} value={student.id}>{student.name} {student.surname}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        )}

        {/* Step 3: Select Date */}
        {step >= 3 && selectedStudentId && (
            <div className="space-y-2 animate-in fade-in-0">
                <label className="font-semibold flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    Étape 3: Sélectionner la date de l'absence
                </label>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={(date) => { setSelectedDate(date); setSelectedLessonId(''); setStep(4); }} initialFocus /></PopoverContent>
                </Popover>
            </div>
        )}
        
        {/* Step 4: Select Lesson */}
        {step >= 4 && selectedDate && (
             <div className="space-y-2 animate-in fade-in-0">
                <label className="font-semibold flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Étape 4: Sélectionner le cours manqué
                </label>
                {availableLessons.length > 0 ? (
                    <Select value={selectedLessonId} onValueChange={(val) => { setSelectedLessonId(val); setStep(5); }}>
                        <SelectTrigger><SelectValue placeholder="Choisir un cours..." /></SelectTrigger>
                        <SelectContent>{availableLessons.map(lesson => <SelectItem key={lesson.id} value={lesson.id.toString()}>{lesson.subject.name} ({formatTime(lesson.startTime)})</SelectItem>)}</SelectContent>
                    </Select>
                ) : (
                    <p className="text-sm text-muted-foreground p-2 border rounded-md">Aucun cours n'est programmé pour cette classe le {format(selectedDate, "PPP", { locale: fr })}.</p>
                )}
            </div>
        )}

        {/* Step 5: Summary and Save */}
        {step >= 5 && selectedLessonId && (
            <Card className="bg-muted/50 p-4 animate-in fade-in-0">
                <CardHeader className="p-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500"/>
                        Résumé de l'absence
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm p-2">
                    <p><strong>Élève:</strong> {selectedStudent?.name} {selectedStudent?.surname}</p>
                    <p><strong>Classe:</strong> {selectedClass?.name}</p>
                    <p><strong>Date:</strong> {selectedDate ? format(selectedDate, "PPPP", { locale: fr }) : 'N/A'}</p>
                    <p><strong>Cours:</strong> {selectedLesson?.subject.name} ({selectedLesson ? formatTime(selectedLesson.startTime) : 'N/A'})</p>
                </CardContent>
            </Card>
        )}

      </CardContent>
      <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetForm}>Réinitialiser</Button>
            <Button onClick={handleSave} disabled={isLoading || step < 5 || !selectedLessonId}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer l'absence
            </Button>
      </CardFooter>
    </Card>
  );
}
