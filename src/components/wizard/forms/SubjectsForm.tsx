// src/components/wizard/forms/SubjectsForm.tsx
'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { BookOpen, Hourglass, Trash2, Star, Plus, Copy, AlertTriangle, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { localAddSubject, localDeleteSubject, localUpdateSubject } from '@/lib/redux/features/subjects/subjectsSlice';
import { setRequirement } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import { useToast } from '@/hooks/use-toast';
import { WizardData, Subject } from '@/types/ wizard-types';

interface SubjectsFormProps {
  wizardData: WizardData;
}

const SubjectsForm: React.FC<SubjectsFormProps> = ({ wizardData }) => {
  const { subjects, classes, lessonRequirements, teacherAssignments } = wizardData;
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [newSubject, setNewSubject] = useState({
    name: '',
    weeklyHours: 2,
    coefficient: 1
  });
  const [isAdding, setIsAdding] = useState(false);
  
  // State for the alert dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleteImpact, setDeleteImpact] = useState(0);

  // State for edit modal
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editValues, setEditValues] = useState({ weeklyHours: 2, coefficient: 1 });

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

  const promptDeleteSubject = (subject: Subject) => {
    const impactCount = teacherAssignments.filter(a => a.subjectId === subject.id).length;
    setSubjectToDelete(subject);
    setDeleteImpact(impactCount);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!subjectToDelete) return;

    dispatch(localDeleteSubject(subjectToDelete.id));
    toast({ 
      title: "Matière supprimée (Brouillon)", 
      description: `La matière "${subjectToDelete.name}" a été retirée de votre configuration.` 
    });
    
    // Reset state
    setIsAlertOpen(false);
    setSubjectToDelete(null);
    setDeleteImpact(0);
  };
  
  const handleOpenEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setEditValues({
        weeklyHours: subject.weeklyHours || 2,
        coefficient: subject.coefficient || 1
    });
  };

  const handleUpdateSubject = () => {
    if (!editingSubject) return;
    dispatch(localUpdateSubject({
        id: editingSubject.id,
        ...editValues
    }));
    toast({ title: 'Matière mise à jour', description: `Les valeurs par défaut pour "${editingSubject.name}" ont été modifiées.` });
    setEditingSubject(null);
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
    <>
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
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(subject)}
                            title="Modifier"
                        >
                            <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => promptDeleteSubject(subject)}
                          className="text-destructive hover:text-destructive/90"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </Button>
                    </div>
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
      </div>

      <Dialog open={editingSubject !== null} onOpenChange={(isOpen) => !isOpen && setEditingSubject(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Modifier la matière: {editingSubject?.name}</DialogTitle>
                <DialogDescription>
                    Ajustez les heures et le coefficient par défaut pour cette matière.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-weeklyHours" className="text-right">Heures/semaine</Label>
                    <Input
                        id="edit-weeklyHours"
                        type="number"
                        min="1"
                        value={editValues.weeklyHours}
                        onChange={(e) => setEditValues(v => ({...v, weeklyHours: parseInt(e.target.value, 10) || 0}))}
                        className="col-span-3"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-coefficient" className="text-right">Coefficient</Label>
                    <Input
                        id="edit-coefficient"
                        type="number"
                        min="1"
                        value={editValues.coefficient}
                        onChange={(e) => setEditValues(v => ({...v, coefficient: parseInt(e.target.value, 10) || 0}))}
                        className="col-span-3"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditingSubject(null)}>Annuler</Button>
                <Button onClick={handleUpdateSubject}>Enregistrer</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir continuer ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteImpact > 0 ? (
                <span className="flex items-start gap-2">
                  <AlertTriangle className="text-destructive h-8 w-8 mt-1" />
                  <div>
                    La suppression de "{subjectToDelete?.name}" impactera <span className="font-bold">{deleteImpact}</span> assignation(s) de professeur(s). 
                    <br />
                    Ces assignations devront être reconfigurées.
                  </div>
                </span>
              ) : (
                `La suppression de la matière "${subjectToDelete?.name}" est définitive.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className={deleteImpact > 0 ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SubjectsForm;
