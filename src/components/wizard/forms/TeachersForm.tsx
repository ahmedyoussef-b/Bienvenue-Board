// src/components/wizard/forms/TeachersForm.tsx
'use client';

import React, { useMemo } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { Users, BookOpen, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { setAssignment, clearAllAssignments } from '@/lib/redux/features/teacherAssignmentsSlice';
import { useToast } from '@/hooks/use-toast';
import { WizardData } from '@/types/ wizard-types';

interface TeachersFormProps {
  wizardData: WizardData;
}

const TeachersForm: React.FC<TeachersFormProps> = ({ wizardData }) => {
  const { teachers, classes, subjects, teacherAssignments: assignments, lessonRequirements } = wizardData;
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleAssignmentChange = (classId: number, subjectId: number, newTeacherId: string | null) => {
    dispatch(setAssignment({ classId, subjectId, teacherId: newTeacherId }));
  };

  const handleReset = () => {
    dispatch(clearAllAssignments());
    toast({ 
      title: 'Assignations réinitialisées', 
      description: "Toutes les assignations ont été effacées du brouillon." 
    });
  };
  
  // Memoize workload calculation
  const teacherWorkload = useMemo(() => {
    const workloadMap = new Map<string, number>();
    teachers.forEach(teacher => {
        const teacherAssignments = assignments.filter(a => a.teacherId === teacher.id);
        let totalHours = 0;
        teacherAssignments.forEach(assignment => {
            assignment.classIds.forEach(classId => {
                const req = lessonRequirements.find(r => r.classId === classId && r.subjectId === assignment.subjectId);
                const subj = subjects.find(s => s.id === assignment.subjectId);
                totalHours += req ? req.hours : (subj?.weeklyHours || 0);
            });
        });
        workloadMap.set(teacher.id, totalHours);
    });
    return workloadMap;
  }, [assignments, teachers, lessonRequirements, subjects]);

  // NEW: Determine which subjects are relevant (i.e., required by at least one class)
  const relevantSubjects = useMemo(() => {
    const relevantSubjectIds = new Set<number>();
    classes.forEach(cls => {
      subjects.forEach(subject => {
        const requiredHours = lessonRequirements.find(
          req => req.classId === cls.id && req.subjectId === subject.id
        )?.hours ?? subject.weeklyHours ?? 0;

        if (requiredHours > 0) {
          relevantSubjectIds.add(subject.id);
        }
      });
    });
    return subjects.filter(s => relevantSubjectIds.has(s.id));
  }, [classes, subjects, lessonRequirements]);


  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Users className="text-primary" size={24} />
            <div>
              <h3 className="text-lg font-semibold">Assigner les Professeurs</h3>
              <p className="text-sm text-muted-foreground">
                Définissez quel professeur enseigne quelle matière dans chaque classe.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center">
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>
      
      <Card>
        <CardContent className="p-2">
            <ScrollArea className="w-full h-[60vh] whitespace-nowrap">
                <Table className="min-w-full border-collapse">
                    <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                            <TableHead className="w-[180px] min-w-[180px] sticky left-0 bg-background z-20">Classe</TableHead>
                            {relevantSubjects.map(subject => (
                                <TableHead key={subject.id} className="w-[200px] min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={14} className="text-muted-foreground" />
                                        {subject.name}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classes.map(cls => (
                            <TableRow key={cls.id}>
                                <TableHead className="sticky left-0 bg-background z-20 font-semibold">{cls.name}</TableHead>
                                {relevantSubjects.map(subject => {
                                    // Check if this class requires this subject
                                    const requirement = lessonRequirements.find(req => req.classId === cls.id && req.subjectId === subject.id);
                                    const requiredHours = requirement ? requirement.hours : (subjects.find(s => s.id === subject.id)?.weeklyHours || 0);

                                    if (requiredHours <= 0) {
                                      return (
                                        <TableCell key={subject.id} className="p-2 align-middle">
                                          <div className="h-10 flex items-center justify-center text-muted-foreground text-sm bg-muted/20 rounded-md p-1">
                                            -
                                          </div>
                                        </TableCell>
                                      );
                                    }

                                    const competentTeachers = teachers.filter(t => t.subjects.some(s => s.id === subject.id));
                                    const currentAssignment = assignments.find(a => a.subjectId === subject.id && a.classIds.includes(cls.id));
                                    const currentTeacherId = currentAssignment?.teacherId || '';

                                    return (
                                        <TableCell key={subject.id} className="p-2">
                                            {competentTeachers.length > 0 ? (
                                                <Select
                                                    value={currentTeacherId}
                                                    onValueChange={(value) => handleAssignmentChange(cls.id, subject.id, value === 'none' ? null : value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Assigner..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">-- Non assigné --</SelectItem>
                                                        {competentTeachers.map(teacher => {
                                                            const workload = teacherWorkload.get(teacher.id) || 0;
                                                            return (
                                                                <SelectItem key={teacher.id} value={teacher.id}>
                                                                    {teacher.surname} {teacher.name.charAt(0)}. ({workload}h)
                                                                </SelectItem>
                                                            )
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="text-xs text-muted-foreground text-center p-2">Aucun prof.</div>
                                            )}
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeachersForm;
