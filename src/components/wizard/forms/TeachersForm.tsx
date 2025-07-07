// src/components/wizard/forms/TeachersForm.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { Users, BookOpen, RotateCcw, PlusCircle, Trash2, AlertTriangle, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { setAssignment, clearAllAssignments, removeAssignmentsForTeacher } from '@/lib/redux/features/teacherAssignmentsSlice';
import { localAddTeacher, localDeleteTeacher } from '@/lib/redux/features/teachers/teachersSlice';
import { useToast } from '@/hooks/use-toast';
import { WizardData, TeacherWithDetails, Subject, Role, UserSex } from '@/types';

interface TeachersFormProps {
  wizardData: WizardData;
}

// --- Sub-components for better organization ---

const TeacherCatalog = ({ teachers, subjects, assignments }: { teachers: TeacherWithDetails[], subjects: Subject[], assignments: any[] }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', surname: '', email: '', subjectIds: [] as string[] });
  
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherWithDetails | null>(null);

  const handleAddTeacher = () => {
    if (!newTeacher.name || !newTeacher.surname || !newTeacher.email) {
      toast({ variant: 'destructive', title: 'Champs requis manquants' });
      return;
    }
    
    const teacherSubjects = subjects.filter(s => newTeacher.subjectIds.includes(s.id.toString()));
    const tempId = `new_${Date.now()}`;

    const newTeacherPayload: TeacherWithDetails = {
      id: tempId,
      userId: `new_user_${Date.now()}`,
      name: newTeacher.name,
      surname: newTeacher.surname,
      phone: null, address: null, img: null, bloodType: null,
      birthday: new Date(), sex: UserSex.MALE,
      user: {
        id: `new_user_${Date.now()}`, name: `${newTeacher.name} ${newTeacher.surname}`,
        email: newTeacher.email, username: newTeacher.email, password: '', role: Role.TEACHER, active: true,
        img: null, createdAt: new Date(), updatedAt: new Date(), twoFactorEnabled: false,
        passwordResetToken: null, passwordResetExpires: null, twoFactorCode: null, twoFactorCodeExpires: null,
      },
      subjects: teacherSubjects,
      classes: [],
      _count: { subjects: teacherSubjects.length, classes: 0 }
    };

    dispatch(localAddTeacher(newTeacherPayload));
    toast({ title: 'Professeur ajouté au brouillon' });
    setIsDialogOpen(false);
    setNewTeacher({ name: '', surname: '', email: '', subjectIds: [] });
  };
  
  const promptDeleteTeacher = (teacher: TeacherWithDetails) => {
    setTeacherToDelete(teacher);
  };
  
  const handleConfirmDelete = () => {
    if (!teacherToDelete) return;

    dispatch(localDeleteTeacher(teacherToDelete.id));
    dispatch(removeAssignmentsForTeacher(teacherToDelete.id));

    toast({ title: 'Professeur supprimé', description: `Toutes les assignations pour ${teacherToDelete.name} ${teacherToDelete.surname} ont été retirées.` });
    setTeacherToDelete(null);
  };

  const assignmentsByTeacher = assignments.reduce((acc, curr) => {
    acc[curr.teacherId] = (acc[curr.teacherId] || 0) + curr.classIds.length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="shadow-inner">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Catalogue des Professeurs</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Ajouter un professeur</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau professeur</DialogTitle>
                <DialogDescription>Les informations seront ajoutées à votre scénario actuel.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Prénom</Label><Input value={newTeacher.name} onChange={(e) => setNewTeacher(s => ({...s, name: e.target.value}))} /></div>
                  <div><Label>Nom</Label><Input value={newTeacher.surname} onChange={(e) => setNewTeacher(s => ({...s, surname: e.target.value}))} /></div>
                </div>
                <div><Label>Email</Label><Input type="email" value={newTeacher.email} onChange={(e) => setNewTeacher(s => ({...s, email: e.target.value}))} /></div>
                <div>
                  <Label>Compétences (Matières)</Label>
                  <Select value={newTeacher.subjectIds[0]} onValueChange={(value) => setNewTeacher(s => ({...s, subjectIds: [value]}))}>
                    <SelectTrigger><SelectValue placeholder="Choisir une matière principale..."/></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleAddTeacher}>Ajouter au catalogue</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professeur</TableHead>
                <TableHead>Compétences</TableHead>
                <TableHead>Assignations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map(teacher => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.name} {teacher.surname}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{teacher.subjects.map(s => s.name).join(', ')}</TableCell>
                  <TableCell>{assignmentsByTeacher[teacher.id] || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => promptDeleteTeacher(teacher)}>
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
       <AlertDialog open={!!teacherToDelete} onOpenChange={(open) => !open && setTeacherToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <span className="font-bold">{teacherToDelete?.name} {teacherToDelete?.surname}</span> ? 
              Toutes ses assignations actuelles dans ce scénario seront également supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
};


const TeachersForm: React.FC<TeachersFormProps> = ({ wizardData }) => {
  const { teachers, classes, subjects, teacherAssignments, lessonRequirements } = wizardData;
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
  
  const teacherWorkload = useMemo(() => {
    const workloadMap = new Map<string, number>();
    teachers.forEach(teacher => {
        const assignmentsForTeacher = teacherAssignments.filter(a => a.teacherId === teacher.id);
        let totalHours = 0;
        assignmentsForTeacher.forEach(assignment => {
            assignment.classIds.forEach(classId => {
                const req = lessonRequirements.find(r => r.classId === classId && r.subjectId === assignment.subjectId);
                const subj = subjects.find(s => s.id === assignment.subjectId);
                totalHours += req ? req.hours : (subj?.weeklyHours || 0);
            });
        });
        workloadMap.set(teacher.id, totalHours);
    });
    return workloadMap;
  }, [teacherAssignments, teachers, lessonRequirements, subjects]);

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
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assignments">Assignations</TabsTrigger>
            <TabsTrigger value="catalog">Catalogue des Professeurs</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
            <Card className="shadow-inner">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Assigner les Professeurs aux Matières</CardTitle>
                        <Button onClick={handleReset} variant="outline" size="sm">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Réinitialiser
                        </Button>
                    </div>
                    <CardDescription>
                      Définissez quel professeur enseigne quelle matière dans chaque classe. Seules les matières avec des heures requises sont affichées.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                            const requirement = lessonRequirements.find(req => req.classId === cls.id && req.subjectId === subject.id);
                                            const requiredHours = requirement ? requirement.hours : (subjects.find(s => s.id === subject.id)?.weeklyHours || 0);

                                            if (requiredHours <= 0) return <TableCell key={subject.id} className="p-2 align-middle"><div className="h-10 flex items-center justify-center text-muted-foreground text-sm bg-muted/20 rounded-md p-1">-</div></TableCell>;

                                            const competentTeachers = teachers.filter(t => t.subjects.some(s => s.id === subject.id));
                                            const currentAssignment = teacherAssignments.find(a => a.subjectId === subject.id && a.classIds.includes(cls.id));
                                            const currentTeacherId = currentAssignment?.teacherId || '';

                                            return (
                                                <TableCell key={subject.id} className="p-2">
                                                    {competentTeachers.length > 0 ? (
                                                        <Select value={currentTeacherId} onValueChange={(value) => handleAssignmentChange(cls.id, subject.id, value === 'none' ? null : value)}>
                                                            <SelectTrigger className="w-full"><SelectValue placeholder="Assigner..." /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">-- Non assigné --</SelectItem>
                                                                {competentTeachers.map(teacher => {
                                                                    const workload = teacherWorkload.get(teacher.id) || 0;
                                                                    return <SelectItem key={teacher.id} value={teacher.id}>{teacher.surname} {teacher.name.charAt(0)}. ({workload}h)</SelectItem>
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : <div className="text-xs text-muted-foreground text-center p-2">Aucun prof.</div>}
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
        </TabsContent>

        <TabsContent value="catalog">
            <TeacherCatalog teachers={teachers} subjects={subjects} assignments={teacherAssignments} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeachersForm;
