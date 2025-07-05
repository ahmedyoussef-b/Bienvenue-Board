// src/components/wizard/ShuddlePageClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector} from '@/hooks/redux-hooks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Loader2, ChevronLeft, ChevronRight, Save } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import ScheduleEditor from '../schedule/ScheduleEditor';

// Hooks
import { useToast } from '@/hooks/use-toast';
import useWizardData from '@/hooks/useWizardData';
import useWizardSteps from '@/hooks/useWizardSteps';
import { selectSchedule, selectScheduleStatus } from '@/lib/redux/features/schedule/scheduleSlice';
import { saveScheduleDraft, selectLastSaved, selectSaveStatus } from '@/lib/redux/features/scheduleDraftSlice';


const ShuddlePageClient: React.FC = () => {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    
    const [mode, setMode] = useState<'wizard' | 'edit'>('wizard');
    const [initialModeSet, setInitialModeSet] = useState(false);

    // Selectors
    const schedule = useAppSelector(selectSchedule);
    const scheduleStatus = useAppSelector(selectScheduleStatus);
    const saveStatus = useAppSelector(selectSaveStatus);
    const lastSaved = useAppSelector(selectLastSaved);

    // Custom hooks
    const wizardData = useWizardData();
    const { steps, currentStep, progress, handleNext, handlePrevious, handleStepClick } = useWizardSteps();

    useEffect(() => {
        if (scheduleStatus === 'succeeded' && !initialModeSet) {
            setMode(schedule && schedule.length > 0 ? 'edit' : 'wizard');
            setInitialModeSet(true);
        }
    }, [schedule, scheduleStatus, initialModeSet]);

    const handleGenerationSuccess = () => setMode('edit');
    const handleSaveDraft = async () => {
        const resultAction = await dispatch(saveScheduleDraft());
        
        if (saveScheduleDraft.fulfilled.match(resultAction)) {
            toast({
                title: "Brouillon sauvegardé !",
                description: `Votre progression a été enregistrée à ${format(new Date(), 'HH:mm:ss')}.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Échec de la sauvegarde",
                description: resultAction.payload as string ?? "Une erreur inconnue est survenue.",
            });
        }
    };

    const renderStepContent = () => {
        const StepComponent = steps[currentStep].component;
        return <StepComponent 
            wizardData={wizardData} 
            onGenerationSuccess={handleGenerationSuccess} 
        />;
    };

    if (!initialModeSet) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const renderWizard = () => (
        <>
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-muted-foreground">
                        Étape {currentStep + 1} sur {steps.length}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                        {Math.round(progress)}% complété
                    </span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
                <StepNavigation 
                    steps={steps}
                    currentStep={currentStep}
                    onStepClick={handleStepClick}
                />
                
                <div className="flex-1">
                    <Card className="p-8 min-h-full">
                        <div className="flex flex-col h-full">
                            <StepHeader 
                                title={steps[currentStep].title}
                                description={steps[currentStep].description}
                            />
                            
                            <div className="flex-grow mb-8">
                                {renderStepContent()}
                            </div>
                            
                            <StepFooter 
                                saveStatus={saveStatus}
                                lastSaved={lastSaved}
                                onSaveDraft={handleSaveDraft}
                                onPrevious={handlePrevious}
                                onNext={handleNext}
                                currentStep={currentStep}
                                stepsLength={steps.length}
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <PageHeader />
                {mode === 'wizard' ? renderWizard() : (
                    <ScheduleEditor 
                        wizardData={wizardData} 
                        onBackToWizard={() => setMode('wizard')} 
                    />
                )}
            </div>
        </div>
    );
};

// Sub-components for better readability
const StepNavigation: React.FC<{
    steps: any[];
    currentStep: number;
    onStepClick: (index: number) => void;
}> = ({ steps, currentStep, onStepClick }) => (
    <div className="w-full md:w-80 space-y-2">
        {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
                <Card 
                    key={step.id} 
                    className={cn(
                        "p-4 cursor-pointer transition-all duration-300 hover:shadow-md", 
                        isActive && "border-primary bg-primary/10", 
                        isCompleted && "border-green-500 bg-green-500/10"
                    )} 
                    onClick={() => onStepClick(index)}
                >
                    <div className="flex items-center space-x-3">
                        <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full",
                            isActive && "bg-primary text-primary-foreground",
                            isCompleted && "bg-green-500 text-white",
                            !isActive && !isCompleted && "bg-muted text-muted-foreground"
                        )}>
                            <Icon size={16} />
                        </div>
                        <div className="flex-1">
                            <h3 className={cn(
                                "font-medium", 
                                isActive && "text-primary", 
                                isCompleted && "text-green-600 dark:text-green-400"
                            )}>
                                {step.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {step.description}
                            </p>
                        </div>
                    </div>
                </Card>
            );
        })}
    </div>
);

const StepHeader: React.FC<{
    title: string;
    description: string;
}> = ({ title, description }) => (
    <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
            {title}
        </h2>
        <p className="text-muted-foreground">
            {description}
        </p>
    </div>
);

const StepFooter: React.FC<{
    saveStatus: string;
    lastSaved: Date | null;
    onSaveDraft: () => void;
    onPrevious: () => void;
    onNext: () => void;
    currentStep: number;
    stepsLength: number;
}> = ({ 
    saveStatus, 
    lastSaved, 
    onSaveDraft, 
    onPrevious, 
    onNext, 
    currentStep, 
    stepsLength 
}) => (
    <div className="flex justify-between items-center mt-auto">
        <div className="flex items-center gap-4">
            <Button 
                variant="outline" 
                onClick={onSaveDraft} 
                disabled={saveStatus === 'loading'}
            >
                {saveStatus === 'loading' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
                Sauvegarder le brouillon
            </Button>
            {lastSaved && (
                <p className="text-xs text-muted-foreground">
                    Dernière sauvegarde: {format(new Date(lastSaved), 'dd/MM/yyyy HH:mm:ss', {locale: fr})}
                </p>
            )}
        </div>
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                onClick={onPrevious} 
                disabled={currentStep === 0}
            >
                <ChevronLeft size={16} className="mr-2" /> 
                Précédent
            </Button>
            <Button 
                onClick={onNext} 
                disabled={currentStep === stepsLength - 1}
            >
                Suivant 
                <ChevronRight size={16} className="ml-2" />
            </Button>
        </div>
    </div>
);

const PageHeader: React.FC = () => (
    <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
            Planificateur d'Emplois du Temps
        </h1>
        <p className="text-lg text-muted-foreground">
            Assistant intelligent pour la planification scolaire
        </p>
    </div>
);

export default ShuddlePageClient;

{/*}
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, School, Users, BookOpen, Calendar, MapPin, CheckCircle, Puzzle, Loader2, Save, Plus, Trash2, Edit, Hourglass, Star, Building, PlusCircle, Clock, RotateCcw, Monitor, FlaskConical, Dumbbell, AlertTriangle, Download, Printer, Eye, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { dayLabels, labSubjectKeywords, sectionOptions } from '@/lib/wizard-utils';

// Redux and Type Imports
import { selectAllClasses, localAddClass, localDeleteClass } from '@/lib/redux/features/classes/classesSlice';
import { selectAllMatieres, localAddSubject, localDeleteSubject } from '@/lib/redux/features/subjects/subjectsSlice';
import { selectAllProfesseurs } from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllSalles, localAddClassroom, localDeleteClassroom } from '@/lib/redux/features/classrooms/classroomsSlice';
import { selectAllGrades } from '@/lib/redux/features/grades/gradesSlice';
import { selectSchedule, setInitialSchedule, saveSchedule as saveScheduleToServer, selectScheduleStatus } from '@/lib/redux/features/schedule/scheduleSlice';
import { selectLessonRequirements, setRequirement } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import { selectTeacherConstraints, addTeacherConstraint, removeTeacherConstraint } from '@/lib/redux/features/teacherConstraintsSlice';
import { selectSubjectRequirements, setSubjectRequirement, setSubjectTimePreference } from '@/lib/redux/features/subjectRequirementsSlice';
import { selectTeacherAssignments, updateTeacherAssignment, clearAllAssignments } from '@/lib/redux/features/teacherAssignmentsSlice';
import { selectSchoolConfig, updateSchoolConfig } from '@/lib/redux/features/schoolConfigSlice';
import type { WizardData, ClassWithGrade, Subject, TeacherWithDetails, Classroom, Lesson, Grade, LessonRequirement, TeacherConstraint, SubjectRequirement, CreateClassPayload, CreateSubjectPayload, CreateClassroomPayload, Day } from '@/types';
import { toast, useToast } from '@/hooks/use-toast';
import { generateSchedule } from '@/lib/schedule-utils';
import ScheduleEditor from '../schedule/ScheduleEditor';
import { fetchScheduleDraft, saveScheduleDraft, selectDraftStatus, selectLastSaved, selectSaveStatus } from '@/lib/redux/features/scheduleDraftSlice';


export const getValidationIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'success':
      return <CheckCircle className="text-green-500" size={20} />;
    case 'warning':
      return <AlertTriangle className="text-yellow-500" size={20} />;
    case 'error':
      return <AlertTriangle className="text-destructive" size={20} />;
    default:
      return null;
  }
};

const SchoolConfigForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectSchoolConfig);

  const handleInputChange = (field: keyof typeof data, value: any) => {
    dispatch(updateSchoolConfig({ [field]: value }));
  };
  
  const dayOptions = [
    { id: 'monday', label: 'Lundi' }, { id: 'tuesday', label: 'Mardi' }, { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' }, { id: 'friday', label: 'Vendredi' }, { id: 'saturday', label: 'Samedi' }
  ];

  const handleDayToggle = (dayId: string, checked: boolean) => {
    const newDays = checked 
      ? [...data.schoolDays, dayId]
      : data.schoolDays.filter(day => day !== dayId);
    handleInputChange('schoolDays', newDays);
  };

  if (!data) return <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card className="p-6"><div className="flex items-center space-x-2 mb-4"><School className="text-primary" size={20} /><h3 className="text-lg font-semibold">Informations de l'établissement</h3></div><div className="space-y-4"><div><Label htmlFor="schoolName">Nom de l'établissement</Label><Input id="schoolName" value={data.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Collège Riadh 5" className="mt-1" /></div></div></Card>
      <Card className="p-6"><div className="flex items-center space-x-2 mb-4"><Clock className="text-primary" size={20} /><h3 className="text-lg font-semibold">Configuration horaire</h3></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><Label htmlFor="startTime">Heure de début</Label><Input id="startTime" type="time" value={data.startTime} onChange={(e) => handleInputChange('startTime', e.target.value)} className="mt-1"/></div><div><Label htmlFor="endTime">Heure de fin</Label><Input id="endTime" type="time" value={data.endTime} onChange={(e) => handleInputChange('endTime', e.target.value)} className="mt-1"/></div><div><Label htmlFor="sessionDuration">Durée d'une séance (minutes)</Label><Select value={data.sessionDuration.toString()} onValueChange={(value) => handleInputChange('sessionDuration', parseInt(value))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="45">45 minutes</SelectItem><SelectItem value="50">50 minutes</SelectItem><SelectItem value="55">55 minutes</SelectItem><SelectItem value="60">1 heure</SelectItem><SelectItem value="90">1h30</SelectItem><SelectItem value="120">2 heures</SelectItem></SelectContent></Select></div></div></Card>
      <Card className="p-6"><div className="flex items-center space-x-2 mb-4"><Calendar className="text-primary" size={20} /><h3 className="text-lg font-semibold">Jours de cours</h3></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{dayOptions.map((day) => (<div key={day.id} className="flex items-center space-x-2"><Checkbox id={day.id} checked={data.schoolDays.includes(day.id)} onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)} /><Label htmlFor={day.id} className="text-sm font-medium">{day.label}</Label></div>))}<div className="mt-4 p-3 bg-primary/10 rounded-lg"><p className="text-sm text-primary"><strong>Sélectionnés:</strong> {data.schoolDays.length} jour(s) de cours par semaine</p></div></div></Card>
      <Card className="p-6 bg-primary/5 border-primary/20"><h3 className="text-lg font-semibold text-primary mb-3">Récapitulatif</h3><div className="space-y-2 text-sm text-primary/90"><p><strong>Établissement:</strong> {data.name || 'Non défini'}</p><p><strong>Horaires:</strong> {data.startTime} - {data.endTime}</p><p><strong>Durée séance:</strong> {data.sessionDuration} minutes</p><p><strong>Jours de cours:</strong> {data.schoolDays.length} jour(s)</p></div></Card>
    </div>
  );
};

const ClassesForm: React.FC<{ data: ClassWithGrade[]; grades: Grade[]; }> = ({ data, grades }) => {
  const dispatch = useAppDispatch(); const { toast } = useToast(); const [newClass, setNewClass] = useState({ gradeLevel: 0, section: '', capacity: 25 }); const [isAdding, setIsAdding] = useState(false); const [editingId, setEditingId] = useState<number | null>(null);
  const handleAddClass = () => { if (!newClass.gradeLevel || !newClass.section || !newClass.capacity) return; const selectedGrade = grades.find(g => g.level === newClass.gradeLevel); if (!selectedGrade) { toast({ variant: "destructive", title: "Erreur de configuration", description: "Le niveau sélectionné est invalide." }); return; } const newClassName = `Niveau ${selectedGrade.level} - ${newClass.section}`; const classExists = data.some(cls => cls.name.trim().toLowerCase() === newClassName.trim().toLowerCase()); if (classExists) { toast({ variant: "destructive", title: "Classe existante", description: `La classe "${newClassName}" existe déjà.` }); return; } dispatch(localAddClass({ id: -Date.now(), name: newClassName, abbreviation: `${selectedGrade.level}${newClass.section}`, capacity: newClass.capacity, gradeId: selectedGrade.id, grade: selectedGrade, _count: { students: 0, lessons: 0 } })); toast({ title: 'Classe ajoutée (Brouillon)', description: `La classe "${newClassName}" a été ajoutée à votre configuration.` }); setNewClass({ gradeLevel: 0, section: '', capacity: 25 }); };
  const handleDeleteClass = (id: number) => { dispatch(localDeleteClass(id)); toast({ title: 'Classe supprimée (Brouillon)', description: `La classe a été supprimée de votre configuration.` }); }; 
  const handleEditClass = (id: number) => { setEditingId(id); toast({ title: 'Info', description: "La fonction d'édition n'est pas encore implémentée." }); };
  return <div className="space-y-6"><Card className="p-6"><div className="flex items-center space-x-2 mb-4"><Plus className="text-primary" size={20} /><h3 className="text-lg font-semibold">Ajouter une classe</h3></div><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div><Label>Niveau</Label><Select value={newClass.gradeLevel ? String(newClass.gradeLevel) : ''} onValueChange={(value) => setNewClass({...newClass, gradeLevel: parseInt(value, 10)})} disabled={isAdding}><SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un niveau" /></SelectTrigger><SelectContent>{grades.map(grade => (<SelectItem key={grade.id} value={String(grade.level)}>{`Niveau ${grade.level}`}</SelectItem>))}</SelectContent></Select></div><div><Label>Section</Label><Select value={newClass.section} onValueChange={(value) => setNewClass({...newClass, section: value})} disabled={isAdding}><SelectTrigger className="mt-1"><SelectValue placeholder="Section" /></SelectTrigger><SelectContent>{sectionOptions.map(section => (<SelectItem key={section} value={section}>{section}</SelectItem>))}</SelectContent></Select></div><div><Label>Nombre d'élèves</Label><Input type="number" value={newClass.capacity} onChange={(e) => setNewClass({...newClass, capacity: parseInt(e.target.value) || 0})} min="1" max="40" className="mt-1" disabled={isAdding} /></div><div className="flex items-end"><Button onClick={handleAddClass} disabled={!newClass.gradeLevel || !newClass.section || !newClass.capacity || isAdding} className="w-full">{isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isAdding ? 'Ajout en cours...' : 'Ajouter'}</Button></div></div></Card><Card className="p-6"><div className="flex items-center space-x-2 mb-4"><Users className="text-primary" size={20} /><h3 className="text-lg font-semibold">Classes configurées ({data.length})</h3></div>{data.length === 0 ? <div className="text-center py-8 text-muted-foreground"><Users size={48} className="mx-auto mb-4 text-muted" /><p>Aucune classe configurée</p><p className="text-sm">Commencez par ajouter votre première classe</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{data.map((cls) => (<Card key={cls.id} className="p-4 hover:shadow-md transition-shadow"><div><div className="flex justify-between items-start mb-3"><div><h4 className="font-semibold text-lg">{cls.name}</h4><p className="text-sm text-muted-foreground">{cls.capacity} élèves</p></div><div className="flex space-x-1"><Button variant="ghost" size="sm" onClick={() => handleEditClass(cls.id)} disabled><Edit size={14} /></Button><Button variant="ghost" size="sm" onClick={() => handleDeleteClass(cls.id)} className="text-destructive hover:text-destructive/90"><Trash2 size={14} /></Button></div></div><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Niveau: {cls.grade?.level || 'N/A'}</span><span>Section: {cls.abbreviation}</span></div></div></Card>))}</div>}</Card>{data.length > 0 && <Card className="p-6 bg-primary/5 border-primary/20"><h3 className="text-lg font-semibold text-primary mb-3">Statistiques</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-primary/90"><div><p className="font-medium">Total classes</p><p className="text-2xl font-bold">{data.length}</p></div><div><p className="font-medium">Total élèves</p><p className="text-2xl font-bold">{data.reduce((sum, cls) => sum + cls.capacity, 0)}</p></div><div><p className="font-medium">Niveaux différents</p><p className="text-2xl font-bold">{new Set(data.map(cls => cls.grade?.level)).size}</p></div><div><p className="font-medium">Effectif moyen</p><p className="text-2xl font-bold">{data.length > 0 ? Math.round(data.reduce((sum, cls) => sum + cls.capacity, 0) / data.length) : 0}</p></div></div></Card>}</div>;
};

const SubjectsForm: React.FC<{ data: Subject[]; classes: ClassWithGrade[]; }> = ({ data: subjects, classes }) => {
  const dispatch = useAppDispatch(); const { toast } = useToast(); const lessonRequirements = useAppSelector(selectLessonRequirements); const firstClassId = classes[0]?.id; const [newSubject, setNewSubject] = useState<Omit<CreateSubjectPayload, 'id'>>({ name: '', weeklyHours: 2, coefficient: 1 }); const [isAdding, setIsAdding] = useState(false); const [deletingId, setDeletingId] = useState<number | null>(null);
  const handleAddSubject = () => { if (!newSubject.name || !newSubject.weeklyHours || !newSubject.coefficient) return; const subjectExists = subjects.some(s => s.name.trim().toLowerCase() === newSubject.name.trim().toLowerCase()); if (subjectExists) { toast({ variant: "destructive", title: "Matière existante", description: `La matière "${newSubject.name}" existe déjà dans le catalogue.` }); return; } dispatch(localAddSubject({ id: -Date.now(), ...newSubject })); toast({ title: 'Matière ajoutée (Brouillon)', description: `La matière "${newSubject.name}" a été ajoutée.` }); setNewSubject({ name: '', weeklyHours: 2, coefficient: 1 }); };
  const handleHoursChange = (classId: number, subjectId: number, hours: number) => dispatch(setRequirement({ classId, subjectId, hours }));
  const getRequirement = (classId: number, subjectId: number): number | undefined => { const specificReq = lessonRequirements.find(r => r.classId === classId && r.subjectId === subjectId); if (specificReq !== undefined) return specificReq.hours; if (classId !== firstClassId && firstClassId !== undefined) { const firstClassReq = lessonRequirements.find(r => r.classId === firstClassId && r.subjectId === subjectId); if (firstClassReq !== undefined) return firstClassReq.hours; } return subjects.find(s => s.id === subjectId)?.weeklyHours; };
  const isUsingDefault = (classId: number, subjectId: number): boolean => { if (classId === firstClassId) return false; const specificReq = lessonRequirements.find(r => r.classId === classId && r.subjectId === subjectId); return specificReq === undefined; };
  const handleDeleteSubject = (id: number) => { dispatch(localDeleteSubject(id)); toast({ title: "Matière supprimée (Brouillon)", description: "La matière a été retirée de votre configuration." }); };
  return <div className="space-y-6"><Card className="p-6"><div className="flex items-center space-x-2 mb-4"><Plus className="text-primary" size={20} /><h3 className="text-lg font-semibold">Ajouter une matière (catalogue)</h3></div><div className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="md:col-span-1"><Label>Nom de la matière</Label><Input value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="Ex: Mathématiques" className="mt-1" disabled={isAdding} /></div><div><Label>Heures/semaine (par défaut)</Label><Input type="number" value={newSubject.weeklyHours} onChange={(e) => setNewSubject({...newSubject, weeklyHours: parseInt(e.target.value) || 0})} min="1" max="10" className="mt-1" disabled={isAdding} /></div><div><Label>Coefficient</Label><Input type="number" value={newSubject.coefficient ?? ''} onChange={(e) => setNewSubject({...newSubject, coefficient: parseInt(e.target.value) || 0})} min="1" max="10" className="mt-1" disabled={isAdding}/></div></div><Button onClick={handleAddSubject} disabled={!newSubject.name || !newSubject.weeklyHours || !newSubject.coefficient || isAdding} className="w-full">{isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isAdding ? 'Ajout en cours...' : 'Ajouter au catalogue'}</Button></div></Card><Card className="p-6"><div className="flex items-center justify-between mb-4"><div className="flex items-center space-x-2"><Hourglass className="text-primary" size={20} /><h3 className="text-lg font-semibold">Configuration des horaires par classe</h3></div></div>{classes.length === 0 || subjects.length === 0 ? <div className="text-center py-8 text-muted-foreground"><p>Veuillez d'abord configurer des classes et des matières.</p></div> : <Accordion type="single" collapsible className="w-full" defaultValue={firstClassId?.toString()}>{classes.map(cls => (<AccordionItem value={cls.id.toString()} key={cls.id}><AccordionTrigger><div className="flex items-center gap-2">{cls.id === firstClassId && <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />}<span>{cls.name}</span></div></AccordionTrigger><AccordionContent><Card className="p-0"><Table><TableHeader><TableRow><TableHead>Matière</TableHead><TableHead className="w-[150px] text-right">Heures/semaine</TableHead><TableHead className="w-[80px] text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{subjects.map(subject => { const requirement = getRequirement(cls.id, subject.id); const isDefaulted = isUsingDefault(cls.id, subject.id); const isCurrentlyDeleting = deletingId === subject.id; return (<TableRow key={subject.id}><TableCell className="font-medium">{subject.name}</TableCell><TableCell className="text-right"><Input id={`hours-${cls.id}-${subject.id}`} type="number" className={cn("w-24 ml-auto", isDefaulted && "text-muted-foreground italic")} min="0" value={requirement ?? ''} onChange={(e) => handleHoursChange(cls.id, subject.id, parseInt(e.target.value) || 0)} title={isDefaulted && firstClassId ? `Valeur par défaut de la classe ${classes.find(c=>c.id === firstClassId)?.name}` : ''} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleDeleteSubject(subject.id)} className="text-destructive hover:text-destructive/90" disabled={isCurrentlyDeleting}>{isCurrentlyDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16}/>}</Button></TableCell></TableRow>);})}</TableBody></Table></Card></AccordionContent></AccordionItem>))}</Accordion>}</Card></div>;
};

const TeachersForm: React.FC = () => {
  const dispatch = useAppDispatch(); const { toast } = useToast(); const allTeachers = useAppSelector(selectAllProfesseurs); const allClasses = useAppSelector(selectAllClasses); const allSubjects = useAppSelector(selectAllMatieres); const assignments = useAppSelector(selectTeacherAssignments);
  const handleClassChange = (teacherId: string, subjectId: number, classId: number, isChecked: boolean) => { const currentAssignment = assignments.find(a => a.teacherId === teacherId && a.subjectId === subjectId); const currentClassIds = currentAssignment?.classIds || []; let newClassIds: number[]; if (isChecked) { newClassIds = [...currentClassIds, classId]; } else { newClassIds = currentClassIds.filter(id => id !== classId); } dispatch(updateTeacherAssignment({ teacherId, subjectId, classIds: newClassIds })); };
  const handleReset = () => { dispatch(clearAllAssignments()); toast({ title: 'Assignations réinitialisées', description: "Toutes les assignations ont été effacées du brouillon." }); };
  return <div className="space-y-6"><Card className="p-6 sticky top-0 bg-background/90 backdrop-blur-sm z-10"><div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"><div className="flex items-center space-x-3"><Users className="text-primary" size={24} /><h3 className="text-lg font-semibold">Assigner les Professeurs aux Classes par Matière</h3><p className="text-sm text-muted-foreground">Définissez quel professeur enseigne quelle matière dans quelles classes.</p></div><div className="flex items-center gap-2 self-end md:self-center"><Button onClick={handleReset} variant="outline"><RotateCcw className="mr-2 h-4 w-4" />Réinitialiser</Button></div></div></Card><Accordion type="multiple" className="w-full space-y-4" defaultValue={allSubjects.map(s => `subject-${s.id}`)}>{allSubjects.map(subject => { const teachersForSubject = allTeachers.filter(t => t.subjects.some(s => s.id === subject.id)); return (<AccordionItem value={`subject-${subject.id}`} key={subject.id} className="border rounded-lg overflow-hidden bg-card"><AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50"><div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{subject.name}</h3></div></AccordionTrigger><AccordionContent className="p-4 md:p-6 space-y-4">{teachersForSubject.length > 0 ? teachersForSubject.map(teacher => { const assignedClassesForSubject = assignments.find(a => a.teacherId === teacher.id && a.subjectId === subject.id)?.classIds || []; return (<Card key={teacher.id} className="p-4"><CardHeader className="p-0 mb-4"><CardTitle className="text-base flex items-center gap-2"><User size={16} />{teacher.name} {teacher.surname}</CardTitle></CardHeader><CardContent className="p-0"><Label className="text-xs text-muted-foreground">Classes à prendre en charge pour cette matière :</Label><ScrollArea className="h-40 mt-2 border rounded-md p-3"><div className="space-y-2">{allClasses.map(cls => { const isAssignedToOther = assignments.some(a => a.subjectId === subject.id && a.teacherId !== teacher.id && a.classIds.includes(cls.id)); return (<div key={cls.id} className="flex items-center space-x-2"><Checkbox id={`check-${teacher.id}-${subject.id}-${cls.id}`} checked={assignedClassesForSubject.includes(cls.id)} onCheckedChange={(checked) => handleClassChange(teacher.id, subject.id, cls.id, !!checked)} disabled={isAssignedToOther} /><Label htmlFor={`check-${teacher.id}-${subject.id}-${cls.id}`} className={cn("text-sm font-normal", isAssignedToOther && "text-muted-foreground line-through")}>{cls.name}</Label></div>); })}</div></ScrollArea></CardContent></Card>); }) : (<p className="text-sm text-muted-foreground text-center py-4">Aucun professeur n'est compétent pour cette matière.</p>)}</AccordionContent></AccordionItem>);})}</Accordion></div>;
};

const ClassroomsForm: React.FC<{ data: Classroom[]; }> = ({ data }) => {
  const dispatch = useAppDispatch(); const { toast } = useToast(); const [newRoom, setNewRoom] = useState<Omit<CreateClassroomPayload, 'id'>>({ name: '', abbreviation: '', capacity: 30, building: 'A' }); const [isAdding, setIsAdding] = useState(false);
  const handleAddRoom = () => { if (!newRoom.name || !newRoom.capacity) return; dispatch(localAddClassroom({ id: -Date.now(), ...newRoom, building: newRoom.building || null, abbreviation: newRoom.abbreviation || null })); toast({ title: 'Salle ajoutée (Brouillon)', description: `La salle "${newRoom.name}" a été ajoutée à votre configuration.` }); setNewRoom({ name: '', abbreviation: '', capacity: 30, building: 'A' }); };
  const handleDeleteRoom = (id: number) => { dispatch(localDeleteClassroom(id)); toast({ title: 'Salle supprimée (Brouillon)', description: `La salle a été supprimée de votre configuration.` }); };
  return <div className="space-y-6"><Card className="p-6"><div className="flex items-center space-x-2 mb-4"><Plus className="text-primary" size={20} /><h3 className="text-lg font-semibold">Ajouter une salle</h3></div><div className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><Label>Nom de la salle</Label><Input value={newRoom.name} onChange={(e) => setNewRoom({...newRoom, name: e.target.value})} placeholder="Ex: Salle A, Labo 1" className="mt-1" disabled={isAdding} /></div><div><Label>Bâtiment</Label><Input value={newRoom.building || ''} onChange={(e) => setNewRoom({...newRoom, building: e.target.value})} placeholder="Ex: A, B" className="mt-1" disabled={isAdding} /></div><div><Label>Capacité</Label><Input type="number" value={newRoom.capacity} onChange={(e) => setNewRoom({...newRoom, capacity: parseInt(e.target.value) || 0})} min="10" max="50" className="mt-1" disabled={isAdding}/></div></div><Button onClick={handleAddRoom} disabled={!newRoom.name || !newRoom.capacity || isAdding} className="w-full">{isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isAdding ? 'Ajout en cours...' : 'Ajouter la salle'}</Button></div></Card><Card className="p-6"><div className="flex items-center space-x-2 mb-4"><MapPin className="text-primary" size={20} /><h3 className="text-lg font-semibold">Salles configurées ({data.length})</h3></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{data.map((room) => (<Card key={room.id} className="p-4 hover:shadow-md transition-shadow"><div className="flex justify-between items-start mb-2"><div><h4 className="font-semibold">{room.name}</h4><p className="text-sm text-muted-foreground">Capacité: {room.capacity} places</p></div><div className="flex items-center space-x-2"><Badge variant="outline">Bât. {room.building}</Badge><Button variant="ghost" size="sm" onClick={() => handleDeleteRoom(room.id)} className="text-destructive hover:text-destructive/90"><Trash2 size={14} /></Button></div></div></Card>))}</div></Card>{data.length === 0 && <Card className="p-6"><div className="text-center py-8 text-muted-foreground"><MapPin size={48} className="mx-auto mb-4 text-muted" /><p>Aucune salle configurée</p><p className="text-sm">Commencez par ajouter des salles une par une</p></div></Card>}{data.length > 0 && <Card className="p-6 bg-primary/5 border-primary/20"><h3 className="text-lg font-semibold text-primary mb-3">Statistiques salles</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-primary/90"><div><p className="font-medium">Total salles</p><p className="text-2xl font-bold">{data.length}</p></div><div><p className="font-medium">Capacité totale</p><p className="text-2xl font-bold">{data.reduce((sum, room) => sum + room.capacity, 0)}</p></div><div><p className="font-medium">Bâtiments</p><p className="text-2xl font-bold">{new Set(data.map(room => room.building)).size}</p></div><div><p className="font-medium">Capacité moyenne</p><p className="text-2xl font-bold">{data.length > 0 ? Math.round(data.reduce((sum, room) => sum + room.capacity, 0) / data.length) : 0}</p></div></div></Card>}</div>;
};

const ConstraintsForm: React.FC = () => {
    const dispatch = useAppDispatch(); const teachers = useAppSelector(selectAllProfesseurs); const subjects = useAppSelector(selectAllMatieres); const salles = useAppSelector(selectAllSalles); const teacherConstraints = useAppSelector(selectTeacherConstraints); const subjectRequirements = useAppSelector(selectSubjectRequirements); const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || ''); const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false); const [newTeacherConstraint, setNewTeacherConstraint] = useState({ day: '', startTime: '', endTime: '', description: '' });
    const filteredTeacherConstraints = useMemo(() => { if (!selectedTeacherId) return []; return teacherConstraints.filter(c => c.teacherId === selectedTeacherId); }, [teacherConstraints, selectedTeacherId]);
    const handleAddTeacherConstraint = () => { if (!selectedTeacherId || !newTeacherConstraint.day || !newTeacherConstraint.startTime || !newTeacherConstraint.endTime) { alert("Veuillez remplir tous les champs obligatoires."); return; } const newEntry: TeacherConstraint = { id: Date.now().toString(), teacherId: selectedTeacherId, day: newTeacherConstraint.day as Day, startTime: newTeacherConstraint.startTime, endTime: newTeacherConstraint.endTime, description: newTeacherConstraint.description }; dispatch(addTeacherConstraint(newEntry)); setIsTeacherFormOpen(false); setNewTeacherConstraint({ day: '', startTime: '', endTime: '', description: '' }); };
    const handleDeleteTeacherConstraint = (id: string) => dispatch(removeTeacherConstraint(id));
    const handleSubjectRequirementChange = (subjectId: number, requiredRoomIdValue: string) => { const roomId = requiredRoomIdValue === 'null' ? null : parseInt(requiredRoomIdValue, 10); dispatch(setSubjectRequirement({ subjectId, requiredRoomId: roomId })); };
    const handleTimePreferenceChange = (subjectId: number, timePreference: 'ANY' | 'AM' | 'PM') => dispatch(setSubjectTimePreference({ subjectId, timePreference }));
    return <Tabs defaultValue="teacher_constraints" className="w-full"><TabsList className="grid w-full grid-cols-2 mb-6"><TabsTrigger value="teacher_constraints"><Users className="mr-2 h-4 w-4"/>Indisponibilités Enseignants</TabsTrigger><TabsTrigger value="subject_requirements"><Building className="mr-2 h-4 w-4" />Exigences des Matières</TabsTrigger></TabsList><TabsContent value="teacher_constraints"><Card className="shadow-inner"><CardHeader><CardTitle>Indisponibilités des Enseignants</CardTitle><CardDescription>Définissez les périodes où chaque enseignant ne peut pas être planifié.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="flex items-center justify-between"><Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} disabled={teachers.length === 0}><SelectTrigger className="w-full md:w-72"><SelectValue placeholder="Sélectionner un enseignant..." /></SelectTrigger><SelectContent>{teachers.map((teacher) => (<SelectItem key={teacher.id} value={teacher.id}>{teacher.name} {teacher.surname}</SelectItem>))}</SelectContent></Select><Dialog open={isTeacherFormOpen} onOpenChange={setIsTeacherFormOpen}><DialogTrigger asChild><Button size="sm" disabled={!selectedTeacherId}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter une indisponibilité</Button></DialogTrigger><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Nouvelle Indisponibilité</DialogTitle><DialogDescription>Pour : {teachers.find(t => t.id === selectedTeacherId)?.name} {teachers.find(t => t.id === selectedTeacherId)?.surname}</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="teacher-day">Jour</Label><Select value={newTeacherConstraint.day} onValueChange={(value) => setNewTeacherConstraint(s => ({...s, day: value}))}><SelectTrigger id="teacher-day"><SelectValue placeholder="Choisir un jour" /></SelectTrigger><SelectContent>{Object.entries(dayLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="start-time">Heure de début</Label><Input id="start-time" type="time" value={newTeacherConstraint.startTime} onChange={(e) => setNewTeacherConstraint(s => ({...s, startTime: e.target.value}))} /></div><div className="space-y-2"><Label htmlFor="end-time">Heure de fin</Label><Input id="end-time" type="time" value={newTeacherConstraint.endTime} onChange={(e) => setNewTeacherConstraint(s => ({...s, endTime: e.target.value}))} /></div></div><div className="space-y-2"><Label htmlFor="teacher-description">Raison (Optionnel)</Label><Textarea id="teacher-description" placeholder="Ex: Rendez-vous médical" value={newTeacherConstraint.description} onChange={(e) => setNewTeacherConstraint(s => ({...s, description: e.target.value}))} /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsTeacherFormOpen(false)}>Annuler</Button><Button onClick={handleAddTeacherConstraint}>Sauvegarder</Button></DialogFooter></DialogContent></Dialog></div><div className="border rounded-lg p-4 space-y-3 min-h-[10rem]">{filteredTeacherConstraints.length > 0 ? filteredTeacherConstraints.map(c => (<div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md"><div className="text-sm"><p className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-orange-600" />Indisponible le <span className="font-bold">{dayLabels[c.day]}</span> de <span className="font-bold">{c.startTime}</span> à <span className="font-bold">{c.endTime}</span>.</p>{c.description && <p className="text-muted-foreground text-xs italic pl-6">"{c.description}"</p>}</div><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteTeacherConstraint(c.id)}><Trash2 className="h-4 w-4" /></Button></div>)) : <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full"><p className="text-lg">Aucune indisponibilité définie pour cet enseignant.</p></div>}</div></CardContent></Card></TabsContent><TabsContent value="subject_requirements"><Card className="shadow-inner"><CardHeader><CardTitle>Exigences des Matières</CardTitle><CardDescription>Associez des matières à des salles spécifiques ou à des préférences horaires (matin/après-midi).</CardDescription></CardHeader><CardContent>{subjects.length > 0 ? (<div className="space-y-4">{subjects.map((subject) => { const requirement = subjectRequirements.find(r => r.subjectId === subject.id); const selectedRoomId = requirement && requirement.requiredRoomId !== null ? String(requirement.requiredRoomId) : 'null'; const selectedTimePref = requirement ? requirement.timePreference : 'ANY'; const subjectNameLower = subject.name.toLowerCase(); const isLabSubject = labSubjectKeywords.some(keyword => subjectNameLower.includes(keyword)); let availableRooms = salles; if (isLabSubject) { const subjectKeyword = labSubjectKeywords.find(k => subjectNameLower.includes(k)); availableRooms = salles.filter(s => s.name.toLowerCase().includes('labo') && s.name.toLowerCase().includes(subjectKeyword!)); } else { availableRooms = salles.filter(s => !s.name.toLowerCase().includes('labo')); } return (<div key={subject.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 gap-4"><Label htmlFor={`subject-req-${subject.id}`} className="text-base font-medium flex-1 pt-2">{subject.name}</Label><div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"><div className="flex-1 min-w-[200px]"><Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Building size={12} />Salle requise</Label><Select value={selectedRoomId} onValueChange={(value) => handleSubjectRequirementChange(subject.id, value)}><SelectTrigger className="mt-1" id={`subject-req-${subject.id}`}><SelectValue placeholder="Choisir une salle..." /></SelectTrigger><SelectContent><SelectItem value="null">N'importe quelle salle disponible</SelectItem>{availableRooms.map((salle) => <SelectItem key={salle.id} value={String(salle.id)}>{salle.name}</SelectItem>)}</SelectContent></Select></div><div className="flex-1 min-w-[150px]"><Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock size={12} />Préférence horaire</Label><Select value={selectedTimePref} onValueChange={(value: 'ANY' | 'AM' | 'PM') => handleTimePreferenceChange(subject.id, value)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ANY">Indifférent</SelectItem><SelectItem value="AM">Matin</SelectItem><SelectItem value="PM">Après-midi</SelectItem></SelectContent></Select></div></div></div>); })}</div>) : <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full"><p className="text-lg">Aucune matière ou salle disponible.</p></div>}</CardContent></Card></TabsContent></Tabs>;
};

const ValidationStep: React.FC<{ wizardData: WizardData, onGenerationSuccess: () => void }> = ({ wizardData, onGenerationSuccess }) => {
    const dispatch = useAppDispatch(); const scheduleStatus = useAppSelector(selectScheduleStatus); const [isGenerating, setIsGenerating] = useState(false); const [generationProgress, setGenerationProgress] = useState(0); const [validationResults, setValidationResults] = useState<any[]>([]); const [isGenerated, setIsGenerated] = useState(false);
    const validateData = useCallback(() => { const results: any[] = []; if (!wizardData.school.name) results.push({ type: 'error', message: "Nom d'établissement manquant" }); if (wizardData.classes.length === 0) results.push({ type: 'error', message: 'Aucune classe configurée' }); if (wizardData.teachers.length === 0) results.push({ type: 'error', message: 'Aucun enseignant configuré' }); if (wizardData.subjects.length === 0) results.push({ type: 'error', message: 'Aucune matière configurée' }); if (results.every(r => r.type !== 'error')) { results.push({ type: 'success', message: 'Configuration valide' }); } return results; }, [wizardData]);
    useEffect(() => { setValidationResults(validateData()); }, [wizardData, validateData]);
    const simulateGeneration = async () => { setIsGenerating(true); setGenerationProgress(0); const steps = ['Analyse...', 'Calcul des créneaux...', 'Assignation...', 'Optimisation...', 'Validation finale...', 'Terminé !']; for (let i = 0; i < steps.length; i++) { await new Promise(resolve => setTimeout(resolve, 500)); setGenerationProgress(((i + 1) / steps.length) * 100); } const finalSchedule = generateSchedule(wizardData); dispatch(setInitialSchedule(finalSchedule)); setIsGenerating(false); setIsGenerated(true); toast({ title: "Génération terminée !", description: "Les emplois du temps ont été générés." }); onGenerationSuccess(); };
    const canGenerate = validationResults.every(result => result.type !== 'error');
    return <div className="space-y-6"><Card className="p-6"><h3 className="text-lg font-semibold mb-4 flex items-center space-x-2"><CheckCircle className="text-primary" size={20} /><span>Validation de la configuration</span></h3><div className="space-y-3">{validationResults.map((result, index) => (<Alert key={index} className={`border-l-4 ${result.type === 'success' ? 'border-green-500 bg-green-500/10' : result.type === 'warning' ? 'border-yellow-500 bg-yellow-500/10' : 'border-destructive bg-destructive/10'}`}><div className="flex items-start space-x-3">{getValidationIcon(result.type)}<div className="flex-1"><AlertDescription><p className={`font-medium ${result.type === 'success' ? 'text-green-700 dark:text-green-400' : result.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400' : 'text-destructive'}`}>{result.message}</p>{result.details && <p className="text-sm text-muted-foreground mt-1">{result.details}</p>}</AlertDescription></div></div></Alert>))}</div></Card><Card className="p-6"><h3 className="text-lg font-semibold mb-4 flex items-center space-x-2"><Calendar className="text-primary" size={20} /><span>Génération des emplois du temps</span></h3>{isGenerating ? <div className="space-y-4"><Progress value={generationProgress} className="h-3" /><div className="flex items-center justify-center space-x-2 text-muted-foreground"><Clock size={20} className="animate-spin" /><span>Génération en cours... {Math.round(generationProgress)}%</span></div></div> : <div className="space-y-4">{!canGenerate && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>Veuillez corriger les erreurs de configuration avant de lancer la génération.</AlertDescription></Alert>}<div className="flex flex-col sm:flex-row gap-4"><Button onClick={simulateGeneration} disabled={!canGenerate} className="flex-1" size="lg"><Calendar size={20} className="mr-2" />Générer l'emploi du temps</Button></div>{canGenerate && !isGenerated && <div className="p-4 bg-green-500/10 rounded-lg mt-4"><p className="text-sm text-green-600 dark:text-green-400">✅ Configuration validée ! La génération peut être lancée.</p></div>}</div>}</Card></div>;
};

// Main Client Component
const ShuddlePageClient: React.FC = () => {
    const dispatch = useAppDispatch();
    
    const [mode, setMode] = useState<'wizard' | 'edit'>('wizard');
    const [currentStep, setCurrentStep] = useState(0);
    const [initialModeSet, setInitialModeSet] = useState(false);

    // Selectors
    const classes = useAppSelector(selectAllClasses);
    const subjects = useAppSelector(selectAllMatieres);
    const teachers = useAppSelector(selectAllProfesseurs);
    const rooms = useAppSelector(selectAllSalles);
    const grades = useAppSelector(selectAllGrades);
    const schedule = useAppSelector(selectSchedule);
    const scheduleStatus = useAppSelector(selectScheduleStatus);
    const lessonRequirements = useAppSelector(selectLessonRequirements);
    const teacherConstraints = useAppSelector(selectTeacherConstraints);
    const subjectRequirements = useAppSelector(selectSubjectRequirements);
    const teacherAssignments = useAppSelector(selectTeacherAssignments);
    const schoolConfig = useAppSelector(selectSchoolConfig);
    
    // Save/Load Draft Selectors
    const saveStatus = useAppSelector(selectSaveStatus);
    const lastSaved = useAppSelector(selectLastSaved);

    const { toast } = useToast();
    
    useEffect(() => {
        if (scheduleStatus === 'succeeded' && !initialModeSet) {
            if (schedule && schedule.length > 0) {
              setMode('edit');
            } else {
              setMode('wizard');
            }
            setInitialModeSet(true);
        }
    }, [schedule, scheduleStatus, initialModeSet]);
  
    const wizardData: WizardData = useMemo(() => ({
      school: schoolConfig,
      classes: classes,
      subjects: subjects,
      teachers: teachers,
      rooms: rooms,
      grades: grades,
      lessonRequirements: lessonRequirements,
      teacherConstraints: teacherConstraints,
      subjectRequirements: subjectRequirements,
      teacherAssignments: teacherAssignments,
    }), [schoolConfig, classes, subjects, teachers, rooms, grades, lessonRequirements, teacherConstraints, subjectRequirements, teacherAssignments]);
  
    const handleNext = () => currentStep < steps.length - 1 && setCurrentStep(currentStep + 1);
    const handlePrevious = () => currentStep > 0 && setCurrentStep(currentStep - 1);
    const handleStepClick = (stepIndex: number) => setCurrentStep(stepIndex);
    const handleGenerationSuccess = () => setMode('edit');
    const handleSaveDraft = useCallback(async () => {
        const resultAction = await dispatch(saveScheduleDraft());
        if (saveScheduleDraft.fulfilled.match(resultAction)) {
            toast({
                title: "Brouillon sauvegardé !",
                description: `Votre progression a été enregistrée à ${format(new Date(), 'HH:mm:ss')}.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Échec de la sauvegarde",
                description: resultAction.payload as string ?? "Une erreur inconnue est survenue.",
            });
        }
    }, [dispatch, toast]);

    const steps = [
        { id: 'school', title: 'Établissement', icon: School, description: 'Paramètres généraux', component: <SchoolConfigForm /> },
        { id: 'classes', title: 'Classes', icon: Users, description: 'Définition des classes', component: <ClassesForm data={classes} grades={grades} /> },
        { id: 'subjects', title: 'Matières', icon: BookOpen, description: 'Horaires par classe', component: <SubjectsForm data={subjects} classes={classes} /> },
        { id: 'teachers', title: 'Professeurs', icon: User, description: 'Gestion des enseignants', component: <TeachersForm /> },
        { id: 'rooms', title: 'Salles', icon: MapPin, description: 'Déclaration des espaces', component: <ClassroomsForm data={rooms} /> },
        { id: 'constraints', title: 'Contraintes', icon: Puzzle, description: 'Indisponibilités et exigences', component: <ConstraintsForm /> },
        { id: 'validation', title: 'Génération', icon: CheckCircle, description: 'Vérification et génération', component: <ValidationStep wizardData={wizardData} onGenerationSuccess={handleGenerationSuccess} /> }
    ];

    const renderStepContent = () => {
        return steps[currentStep].component;
    };

    const progress = ((currentStep + 1) / steps.length) * 100;
    
    if (!initialModeSet) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    const wizardComponent = (
        <>
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-muted-foreground">Étape {currentStep + 1} sur {steps.length}</span>
                    <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}% complété</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-80 space-y-2">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;
                        return (
                            <Card key={step.id} className={cn("p-4 cursor-pointer transition-all duration-300 hover:shadow-md", isActive && "border-primary bg-primary/10", isCompleted && "border-green-500 bg-green-500/10")} onClick={() => handleStepClick(index)}>
 <div className="flex items-center space-x-3">
                                    <div className={cn("flex items-center justify-center w-8 h-8 rounded-full", isActive && "bg-primary text-primary-foreground", isCompleted && "bg-green-500 text-white", !isActive && !isCompleted && "bg-muted text-muted-foreground")}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={cn("font-medium", isActive && "text-primary", isCompleted && "text-green-600 dark:text-green-400")}>{step.title}</h3>
                                        <p className="text-sm text-muted-foreground">{step.description}</p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
                <div className="flex-1">
                    <Card className="p-8 min-h-full">
                        <div className="flex flex-col h-full">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-foreground mb-2">{steps[currentStep].title}</h2>
                                <p className="text-muted-foreground">{steps[currentStep].description}</p>
                            </div>
                            <div className="flex-grow mb-8">{renderStepContent()}</div>
                            <div className="flex justify-between items-center mt-auto">
                                <div className="flex items-center gap-4">
                                  <Button variant="outline" onClick={handleSaveDraft} disabled={saveStatus === 'loading'}>
                                    {saveStatus === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                    Sauvegarder le brouillon
                                  </Button>
                                  {lastSaved && <p className="text-xs text-muted-foreground">Dernière sauvegarde: {format(new Date(lastSaved), 'dd/MM/yyyy HH:mm:ss', {locale: fr})}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}><ChevronLeft size={16} className="mr-2" /> Précédent</Button>
                                  <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>Suivant <ChevronRight size={16} className="ml-2" /></Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );

    const renderContent = () => {
        switch (mode) {
            case 'wizard': return wizardComponent;
            case 'edit': return <ScheduleEditor wizardData={wizardData} onBackToWizard={() => setMode('wizard')} />;
            default: return wizardComponent;
        }
    };
    
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Planificateur d'Emplois du Temps</h1>
            <p className="text-lg text-muted-foreground">Assistant intelligent pour la planification scolaire</p>
          </div>
          {renderContent()}
        </div>
      </div>
    );
}
export default ShuddlePageClient;
{*/}
