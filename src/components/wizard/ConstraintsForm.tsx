// src/components/wizard/ConstraintsForm.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Clock, User, Building, Puzzle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { selectAllProfesseurs } from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllMatieres } from '@/lib/redux/features/subjects/subjectsSlice';
import { selectAllSalles } from '@/lib/redux/features/classrooms/classroomsSlice';
import { addTeacherConstraint, removeTeacherConstraint, selectTeacherConstraints } from '@/lib/redux/features/teacherConstraintsSlice';
import { setSubjectRequirement, selectSubjectRequirements, setSubjectTimePreference } from '@/lib/redux/features/subjectRequirementsSlice';
import type { TeacherConstraint, SubjectRequirement, Day } from '@/types';

const dayLabels: Record<Day, string> = { MONDAY: 'Lundi', TUESDAY: 'Mardi', WEDNESDAY: 'Mercredi', THURSDAY: 'Jeudi', FRIDAY: 'Vendredi', SATURDAY: 'Samedi', SUNDAY: 'Dimanche' };

const ConstraintsForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const teachers = useAppSelector(selectAllProfesseurs);
  const subjects = useAppSelector(selectAllMatieres);
  const salles = useAppSelector(selectAllSalles);
  const teacherConstraints = useAppSelector(selectTeacherConstraints);
  const subjectRequirements = useAppSelector(selectSubjectRequirements);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
  const [newTeacherConstraint, setNewTeacherConstraint] = useState({
      day: '',
      startTime: '',
      endTime: '',
      description: '',
  });

  const filteredTeacherConstraints = useMemo(() => {
    if (!selectedTeacherId) return [];
    return teacherConstraints.filter(c => c.teacherId === selectedTeacherId);
  }, [teacherConstraints, selectedTeacherId]);

  const handleAddTeacherConstraint = () => {
    if (!selectedTeacherId || !newTeacherConstraint.day || !newTeacherConstraint.startTime || !newTeacherConstraint.endTime) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const newEntry: TeacherConstraint = {
      id: Date.now().toString(),
      teacherId: selectedTeacherId,
      day: newTeacherConstraint.day as Day,
      startTime: newTeacherConstraint.startTime,
      endTime: newTeacherConstraint.endTime,
      description: newTeacherConstraint.description,
    };
    dispatch(addTeacherConstraint(newEntry));
    setIsTeacherFormOpen(false);
    setNewTeacherConstraint({ day: '', startTime: '', endTime: '', description: '' });
  };

  const handleDeleteTeacherConstraint = (id: string) => {
      dispatch(removeTeacherConstraint(id));
  };

  const handleSubjectRequirementChange = (subjectId: number, requiredRoomId: string) => {
    const roomId = requiredRoomId === 'any' ? 'any' : parseInt(requiredRoomId, 10);
    dispatch(setSubjectRequirement({ subjectId, requiredRoomId: roomId }));
  };

  const handleTimePreferenceChange = (subjectId: number, timePreference: 'ANY' | 'AM' | 'PM') => {
    dispatch(setSubjectTimePreference({ subjectId, timePreference }));
  };
  
  const labSubjectKeywords = ['physique', 'informatique', 'sciences', 'technique'];

  return (
    <Tabs defaultValue="teacher_constraints" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="teacher_constraints"><User className="mr-2 h-4 w-4"/>Indisponibilités Enseignants</TabsTrigger>
        <TabsTrigger value="subject_requirements"><Building className="mr-2 h-4 w-4" />Exigences des Matières</TabsTrigger>
      </TabsList>

      <TabsContent value="teacher_constraints">
        <Card className="shadow-inner">
          <CardHeader>
            <CardTitle>Indisponibilités des Enseignants</CardTitle>
            <CardDescription>Définissez les périodes où chaque enseignant ne peut pas être planifié.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                  <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} disabled={teachers.length === 0}>
                      <SelectTrigger className="w-full md:w-72">
                          <SelectValue placeholder="Sélectionner un enseignant..." />
                      </SelectTrigger>
                      <SelectContent>
                          {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.name} {teacher.surname}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Dialog open={isTeacherFormOpen} onOpenChange={setIsTeacherFormOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={!selectedTeacherId}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter une indisponibilité</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Nouvelle Indisponibilité</DialogTitle>
                        <DialogDescription>Pour : {teachers.find(t => t.id === selectedTeacherId)?.name} {teachers.find(t => t.id === selectedTeacherId)?.surname}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                          <div className="space-y-2">
                              <Label htmlFor="teacher-day">Jour</Label>
                              <Select value={newTeacherConstraint.day} onValueChange={(value) => setNewTeacherConstraint(s => ({...s, day: value}))}>
                                  <SelectTrigger id="teacher-day"><SelectValue placeholder="Choisir un jour" /></SelectTrigger>
                                  <SelectContent>{Object.entries(dayLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
                              </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2"><Label htmlFor="start-time">Heure de début</Label><Input id="start-time" type="time" value={newTeacherConstraint.startTime} onChange={(e) => setNewTeacherConstraint(s => ({...s, startTime: e.target.value}))} /></div>
                              <div className="space-y-2"><Label htmlFor="end-time">Heure de fin</Label><Input id="end-time" type="time" value={newTeacherConstraint.endTime} onChange={(e) => setNewTeacherConstraint(s => ({...s, endTime: e.target.value}))} /></div>
                          </div>
                          <div className="space-y-2"><Label htmlFor="teacher-description">Raison (Optionnel)</Label><Textarea id="teacher-description" placeholder="Ex: Rendez-vous médical" value={newTeacherConstraint.description} onChange={(e) => setNewTeacherConstraint(s => ({...s, description: e.target.value}))} /></div>
                      </div>
                      <DialogFooter>
                          <Button variant="outline" onClick={() => setIsTeacherFormOpen(false)}>Annuler</Button>
                          <Button onClick={handleAddTeacherConstraint}>Sauvegarder</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
              </div>

              <div className="border rounded-lg p-4 space-y-3 min-h-[10rem]">
                  {filteredTeacherConstraints.length > 0 ? filteredTeacherConstraints.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                          <div className="text-sm">
                              <p className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-orange-600" />Indisponible le <span className="font-bold">{dayLabels[c.day]}</span> de <span className="font-bold">{c.startTime}</span> à <span className="font-bold">{c.endTime}</span>.</p>
                              {c.description && <p className="text-muted-foreground text-xs italic pl-6">"{c.description}"</p>}
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteTeacherConstraint(c.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                  )) : <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full"><p className="text-lg">Aucune indisponibilité définie pour cet enseignant.</p></div>}
              </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="subject_requirements">
        <Card className="shadow-inner">
          <CardHeader>
            <CardTitle>Exigences des Matières</CardTitle>
            <CardDescription>Associez des matières à des salles spécifiques ou à des préférences horaires (matin/après-midi).</CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length > 0 ? (
              <div className="space-y-4">
                {subjects.map((subject) => {
                  const requirement = subjectRequirements.find(r => r.subjectId === subject.id);
                  const selectedRoomId = requirement ? String(requirement.requiredRoomId) : 'any';
                  const selectedTimePref = requirement ? requirement.timePreference : 'ANY';
                  
                  const subjectNameLower = subject.name.toLowerCase();
                  const isLabSubject = labSubjectKeywords.some(keyword => subjectNameLower.includes(keyword));

                  let availableRooms = salles;
                  if (isLabSubject) {
                    const subjectKeyword = labSubjectKeywords.find(k => subjectNameLower.includes(k));
                    availableRooms = salles.filter(s => s.name.toLowerCase().includes('labo') && s.name.toLowerCase().includes(subjectKeyword!));
                  } else {
                    availableRooms = salles.filter(s => !s.name.toLowerCase().includes('labo'));
                  }

                  return (
                    <div key={subject.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 gap-4">
                      <Label htmlFor={`subject-req-${subject.id}`} className="text-base font-medium flex-1 pt-2">{subject.name}</Label>
                      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="flex-1 min-w-[200px]">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Building size={12} />Salle requise</Label>
                          <Select value={selectedRoomId} onValueChange={(value) => handleSubjectRequirementChange(subject.id, value)}>
                            <SelectTrigger className="mt-1" id={`subject-req-${subject.id}`}><SelectValue placeholder="Choisir une salle..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">N'importe quelle salle disponible</SelectItem>
                              {availableRooms.map((salle) => <SelectItem key={salle.id} value={String(salle.id)}>{salle.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock size={12} />Préférence horaire</Label>
                          <Select value={selectedTimePref} onValueChange={(value: 'ANY' | 'AM' | 'PM') => handleTimePreferenceChange(subject.id, value)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ANY">Indifférent</SelectItem>
                              <SelectItem value="AM">Matin</SelectItem>
                              <SelectItem value="PM">Après-midi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full"><p className="text-lg">Aucune matière ou salle disponible.</p></div>}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ConstraintsForm;
