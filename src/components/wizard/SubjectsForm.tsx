import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Plus, Hourglass, Loader2, Trash2, Star, Save } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Subject, Class, CreateSubjectPayload } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { localAddSubject, localDeleteSubject } from '@/lib/redux/features/subjects/subjectsSlice';
import { setRequirement, selectLessonRequirements } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SubjectsFormProps {
  data: Subject[];
  classes: Class[];
}

const SubjectsForm: React.FC<SubjectsFormProps> = ({ data: subjects, classes }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const lessonRequirements = useAppSelector(selectLessonRequirements);
  const firstClassId = classes[0]?.id;

  const [newSubject, setNewSubject] = useState<Omit<CreateSubjectPayload, 'id'>>({
    name: '',
    weeklyHours: 2,
    coefficient: 1,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleAddSubject = () => {
    if (!newSubject.name || !newSubject.weeklyHours || !newSubject.coefficient) return;

    const subjectExists = subjects.some(s => s.name.trim().toLowerCase() === newSubject.name.trim().toLowerCase());
    if (subjectExists) {
        toast({
            variant: "destructive",
            title: "Matière existante",
            description: `La matière "${newSubject.name}" existe déjà dans le catalogue.`,
        });
        return;
    }

    dispatch(localAddSubject({
      id: -Date.now(), // Temporary ID
      ...newSubject
    }));

    toast({
      title: 'Matière ajoutée (Brouillon)',
      description: `La matière "${newSubject.name}" a été ajoutée.`,
    });
    setNewSubject({ name: '', weeklyHours: 2, coefficient: 1 });
  };

  const handleHoursChange = (classId: number, subjectId: number, hours: number) => {
    dispatch(setRequirement({ classId, subjectId, hours }));
  };
  
  const getRequirement = (classId: number, subjectId: number): number | undefined => {
    const specificReq = lessonRequirements.find(r => r.classId === classId && r.subjectId === subjectId);
    if (specificReq !== undefined) {
      return specificReq.hours;
    }

    if (classId !== firstClassId && firstClassId !== undefined) {
      const firstClassReq = lessonRequirements.find(r => r.classId === firstClassId && r.subjectId === subjectId);
      if (firstClassReq !== undefined) {
        return firstClassReq.hours;
      }
    }
    
    return subjects.find(s => s.id === subjectId)?.weeklyHours;
  };

  const isUsingDefault = (classId: number, subjectId: number): boolean => {
      if (classId === firstClassId) return false;
      const specificReq = lessonRequirements.find(r => r.classId === classId && r.subjectId === subjectId);
      return specificReq === undefined;
  };

  const handleDeleteSubject = (id: number) => {
    dispatch(localDeleteSubject(id));
    toast({
      title: "Matière supprimée (Brouillon)",
      description: "La matière a été retirée de votre configuration.",
    });
  };

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
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                placeholder="Ex: Mathématiques"
                className="mt-1"
                disabled={isAdding}
              />
            </div>
            <div>
              <Label>Heures/semaine (par défaut)</Label>
              <Input type="number" value={newSubject.weeklyHours} onChange={(e) => setNewSubject({...newSubject, weeklyHours: parseInt(e.target.value) || 0})} min="1" max="10" className="mt-1" disabled={isAdding} />
            </div>
            <div>
              <Label>Coefficient</Label>
              <Input type="number" value={newSubject.coefficient} onChange={(e) => setNewSubject({...newSubject, coefficient: parseInt(e.target.value) || 0})} min="1" max="10" className="mt-1" disabled={isAdding}/>
            </div>
          </div>
          <Button onClick={handleAddSubject} disabled={!newSubject.name || !newSubject.weeklyHours || !newSubject.coefficient || isAdding} className="w-full">
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAdding ? 'Ajout en cours...' : 'Ajouter au catalogue'}
          </Button>
        </div>
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
                    {cls.id === firstClassId && <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" title="Classe modèle pour les valeurs par défaut" />}
                    <span>{cls.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                   <Card className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matière</TableHead>
                          <TableHead className="w-[150px] text-right">Heures/semaine</TableHead>
                          <TableHead className="w-[80px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjects.map(subject => {
                          const requirement = getRequirement(cls.id, subject.id);
                          const isDefaulted = isUsingDefault(cls.id, subject.id);
                          const isCurrentlyDeleting = deletingId === subject.id;
                          return (
                            <TableRow key={subject.id}>
                              <TableCell className="font-medium">{subject.name}</TableCell>
                              <TableCell className="text-right">
                                <Input
                                  id={`hours-${cls.id}-${subject.id}`}
                                  type="number"
                                  className={cn("w-24 ml-auto", isDefaulted && "text-muted-foreground italic")}
                                  min="0"
                                  value={requirement ?? ''}
                                  onChange={(e) => handleHoursChange(cls.id, subject.id, parseInt(e.target.value) || 0)}
                                  title={isDefaulted && firstClassId ? `Valeur par défaut de la classe ${classes.find(c=>c.id === firstClassId)?.name}` : ''}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                  <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDeleteSubject(subject.id)}
                                      className="text-destructive hover:text-destructive/90"
                                      disabled={isCurrentlyDeleting}
                                  >
                                      {isCurrentlyDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16}/>}
                                  </Button>
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
  );
};

export default SubjectsForm;
