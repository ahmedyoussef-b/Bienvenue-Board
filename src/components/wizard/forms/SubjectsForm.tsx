// src/components/wizard/forms/SubjectsForm.tsx
'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { BookOpen, Hourglass, Trash2, Star, Plus, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { localAddSubject, localDeleteSubject } from '@/lib/redux/features/subjects/subjectsSlice';
import { setRequirement } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import { useToast } from '@/hooks/use-toast';
import SaveDraftButton from '../SaveDraftButton';
import { WizardData } from '@/types/ wizard-types';

interface SubjectsFormProps {
  wizardData: WizardData;
}

const SubjectsForm: React.FC<SubjectsFormProps> = ({ wizardData }) => {
  const { subjects, classes, lessonRequirements } = wizardData;
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [newSubject, setNewSubject] = useState({
    name: '',
    weeklyHours: 2,
    coefficient: 1
  });
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleAddSubject = () => {
    if (!newSubject.name || !newSubject.weeklyHours || !newSubject.coefficient) return;
    
    const subjectExists = subjects.some(s => 
      s.name.trim().toLowerCase() === newSubject.name.trim().toLowerCase()
    );

    if (subjectExists) {
      toast({
        variant: "destructive",
        title: "Matière existante",
        description: `La matière "${newSubject.name}" existe déjà dans le catalogue.`
      });
      return;
    }

    setIsAdding(true);
    dispatch(localAddSubject({ 
      id: -Date.now(), 
      ...newSubject 
    }));

    toast({
      title: 'Matière ajoutée (Brouillon)',
      description: `La matière "${newSubject.name}" a été ajoutée.`
    });

    setNewSubject({ name: '', weeklyHours: 2, coefficient: 1 });
    setIsAdding(false);
  };

  const handleDeleteSubject = (id: number) => {
    setDeletingId(id);
    dispatch(localDeleteSubject(id));
    toast({ 
      title: "Matière supprimée (Brouillon)", 
      description: "La matière a été retirée de votre configuration." 
    });
    setDeletingId(null);
  };

  const handleHoursChange = (classId: number, subjectId: number, hours: number) => {
    dispatch(setRequirement({ classId, subjectId, hours }));
  };

  const handleApplyToGrade = (sourceClassId: number) => {
    const sourceClass = classes.find(c => c.id === sourceClassId);
    if (!sourceClass || !sourceClass.gradeId) return;

    const targetClasses = classes.filter(c => c.gradeId === sourceClass.gradeId && c.id !== sourceClassId);
    if (targetClasses.length === 0) {
        toast({ title: "Aucune autre classe", description: "Il n'y a pas d'autres classes dans ce niveau à configurer." });
        return;
    }

    subjects.forEach(subject => {
        const sourceRequirementHours = getRequirement(sourceClassId, subject.id);
        
        targetClasses.forEach(targetClass => {
            dispatch(setRequirement({
                classId: targetClass.id,
                subjectId: subject.id,
                hours: sourceRequirementHours,
            }));
        });
    });

    toast({
        title: "Configuration appliquée",
        description: `Les exigences horaires de la classe ${sourceClass.name} ont été appliquées à ${targetClasses.length} autre(s) classe(s) du même niveau.`
    });
  };

  const getRequirement = (classId: number, subjectId: number): number => {
      const specificReq = lessonRequirements.find(r => 
          r.classId === classId && r.subjectId === subjectId
      );
      return specificReq?.hours ?? subjects.find(s => s.id === subjectId)?.weeklyHours ?? 0;
  };

  const isUsingDefault = (classId: number, subjectId: number): boolean => {
      return !lessonRequirements.some(r => r.classId === classId && r.subjectId === subjectId);
  };

  const firstClassId = classes[0]?.id;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Ajouter une matière (catalogue)</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Label>Nom de la matière</Label>
              <Input 
                value={newSubject.name} 
                onChange={(e) => setNewSubject({ 
                  ...newSubject, 
                  name: e.target.value 
                })} 
                placeholder="Ex: Mathématiques" 
                className="mt-1" 
                disabled={isAdding} 
              />
            </div>
            
            <div>
              <Label>Heures/semaine (par défaut)</Label>
              <Input 
                type="number" 
                value={newSubject.weeklyHours} 
                onChange={(e) => setNewSubject({
                  ...newSubject, 
                  weeklyHours: parseInt(e.target.value) || 0
                })} 
                min="1" 
                max="10" 
                className="mt-1" 
                disabled={isAdding} 
              />
            </div>
            
            <div>
              <Label>Coefficient</Label>
              <Input 
                type="number" 
                value={newSubject.coefficient ?? ''} 
                onChange={(e) => setNewSubject({
                  ...newSubject, 
                  coefficient: parseInt(e.target.value) || 0
                })} 
                min="1" 
                max="10" 
                className="mt-1" 
                disabled={isAdding}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAddSubject} 
            disabled={!newSubject.name || !newSubject.weeklyHours || !newSubject.coefficient || isAdding} 
            className="w-full"
          >
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAdding ? 'Ajout en cours...' : 'Ajouter au catalogue'}
          </Button>
        </div>
        
        {subjects.length > 0 && (
          <>
            <hr className="my-6" />
            <h4 className="text-md font-semibold text-muted-foreground mb-4">Matières existantes</h4>
            <div className="space-y-2">
              {subjects.map(subject => (
                <div key={subject.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span className="font-medium">{subject.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="text-destructive hover:text-destructive/90"
                    disabled={deletingId === subject.id}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Hourglass className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Configuration des horaires par classe</h3>
          </div>
        </div>
        
        {classes.length === 0 || subjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Veuillez d'abord configurer des classes et des matières.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full" defaultValue={firstClassId?.toString()}>
            {classes.map(cls => (
              <AccordionItem value={cls.id.toString()} key={cls.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    {cls.id === firstClassId && (
                      <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
                    )}
                    <span>{cls.name}</span>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent>
                  <Card className="p-0">
                    <div className="p-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyToGrade(cls.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Appliquer à tout le niveau {cls.grade?.level}
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matière</TableHead>
                          <TableHead className="w-[150px] text-right">Heures/semaine</TableHead>
                        </TableRow>
                      </TableHeader>
                      
                      <TableBody>
                        {subjects.map(subject => {
                          const requirement = getRequirement(cls.id, subject.id);
                          const isDefaulted = isUsingDefault(cls.id, subject.id);
                          
                          return (
                            <TableRow key={subject.id}>
                              <TableCell className="font-medium">
                                {subject.name}
                              </TableCell>
                              
                              <TableCell className="text-right">
                                <Input
                                  id={`hours-${cls.id}-${subject.id}`}
                                  type="number"
                                  className={cn(
                                    "w-24 ml-auto",
                                    isDefaulted && "text-muted-foreground italic"
                                  )}
                                  min="0"
                                  value={requirement ?? ''}
                                  onChange={(e) => handleHoursChange(
                                    cls.id, 
                                    subject.id, 
                                    parseInt(e.target.value) || 0
                                  )}
                                  title={isDefaulted 
                                    ? `Valeur par défaut du sujet : ${subjects.find(s => s.id === subject.id)?.weeklyHours}`
                                    : ''
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Card>
      <SaveDraftButton />
    </div>
  );
};

export default SubjectsForm;
