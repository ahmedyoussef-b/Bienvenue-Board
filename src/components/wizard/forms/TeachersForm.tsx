// src/components/wizard/forms/TeachersForm.tsx
'use client';

import React from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { Users, BookOpen, User, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { updateTeacherAssignment, clearAllAssignments } from '@/lib/redux/features/teacherAssignmentsSlice';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import SaveDraftButton from '../SaveDraftButton';
import { WizardData } from '@/types/ wizard-types';

interface TeachersFormProps {
  wizardData: WizardData;
}

const TeachersForm: React.FC<TeachersFormProps> = ({ wizardData }) => {
  const { teachers, classes, subjects, teacherAssignments: assignments } = wizardData;
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleClassChange = (
    teacherId: string, 
    subjectId: number, 
    classId: number, 
    isChecked: boolean
  ) => {
    const currentAssignment = assignments.find(a => 
      a.teacherId === teacherId && a.subjectId === subjectId
    );
    
    const currentClassIds = currentAssignment?.classIds || [];
    let newClassIds: number[];
    
    if (isChecked) {
      newClassIds = [...currentClassIds, classId];
    } else {
      newClassIds = currentClassIds.filter(id => id !== classId);
    }
    
    dispatch(updateTeacherAssignment({ 
      teacherId, 
      subjectId, 
      classIds: newClassIds 
    }));
  };

  const handleReset = () => {
    dispatch(clearAllAssignments());
    toast({ 
      title: 'Assignations réinitialisées', 
      description: "Toutes les assignations ont été effacées du brouillon." 
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Users className="text-primary" size={24} />
            <div>
                <h3 className="text-lg font-semibold">Assigner les Professeurs aux Classes par Matière</h3>
                <p className="text-sm text-muted-foreground">
                Définissez quel professeur enseigne quelle matière dans quelles classes.
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

      <Accordion type="multiple" className="w-full space-y-4" defaultValue={subjects.map(s => `subject-${s.id}`)}>
        {subjects.map(subject => {
          const teachersForSubject = teachers.filter(t => 
            t.subjects.some(s => s.id === subject.id)
          );
          
          return (
            <AccordionItem 
              value={`subject-${subject.id}`} 
              key={subject.id} 
              className="border rounded-lg overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{subject.name}</h3>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="p-4 md:p-6 space-y-4">
                {teachersForSubject.length > 0 ? (
                  teachersForSubject.map(teacher => {
                    const assignedClassesForSubject = assignments.find(a => 
                      a.teacherId === teacher.id && a.subjectId === subject.id
                    )?.classIds || [];
                    
                    return (
                      <Card key={teacher.id} className="p-4">
                        <CardHeader className="p-0 mb-4">
                          <CardTitle className="text-base flex items-center gap-2">
                            <User size={16} />
                            {teacher.name} {teacher.surname}
                          </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="p-0">
                          <Label className="text-xs text-muted-foreground">
                            Classes à prendre en charge pour cette matière :
                          </Label>
                          
                          <ScrollArea className="h-40 mt-2 border rounded-md p-3">
                            <div className="space-y-2">
                              {classes.map(cls => {
                                const isAssignedToOther = assignments.some(a => 
                                  a.subjectId === subject.id && 
                                  a.teacherId !== teacher.id && 
                                  a.classIds.includes(cls.id)
                                );
                                
                                return (
                                  <div key={cls.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`check-${teacher.id}-${subject.id}-${cls.id}`}
                                      checked={assignedClassesForSubject.includes(cls.id)}
                                      onCheckedChange={(checked) => handleClassChange(
                                        teacher.id, 
                                        subject.id, 
                                        cls.id, 
                                        !!checked
                                      )}
                                      disabled={isAssignedToOther}
                                    />
                                    <Label 
                                      htmlFor={`check-${teacher.id}-${subject.id}-${cls.id}`}
                                      className={cn(
                                        "text-sm font-normal",
                                        isAssignedToOther && "text-muted-foreground line-through cursor-not-allowed"
                                      )}
                                    >
                                      {cls.name}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun professeur n'est compétent pour cette matière.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      <SaveDraftButton />
    </div>
  );
};

export default TeachersForm;
