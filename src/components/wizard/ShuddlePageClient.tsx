// src/components/wizard/ShuddlePageClient.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, School, Users, BookOpen, Calendar, MapPin, CheckCircle, Puzzle, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { selectAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { selectAllMatieres } from '@/lib/redux/features/subjects/subjectsSlice';
import { selectAllProfesseurs } from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllSalles } from '@/lib/redux/features/classrooms/classroomsSlice';
import { selectAllGrades } from '@/lib/redux/features/grades/gradesSlice';
import { selectSchedule, selectScheduleStatus } from '@/lib/redux/features/schedule/scheduleSlice';
import { selectLessonRequirements } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import { selectTeacherConstraints } from '@/lib/redux/features/teacherConstraintsSlice';
import { selectSubjectRequirements } from '@/lib/redux/features/subjectRequirementsSlice';
import { selectTeacherAssignments } from '@/lib/redux/features/teacherAssignmentsSlice';
import { selectSchoolConfig } from '@/lib/redux/features/schoolConfigSlice';
import { saveScheduleDraft, selectSaveStatus, selectLastSaved } from '@/lib/redux/features/scheduleDraftSlice';

import type { WizardData } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Dynamic imports for wizard steps
const SchoolConfigForm = dynamic(() => import('./SchoolConfigForm'), { loading: () => <p>Chargement...</p> });
const ClassesForm = dynamic(() => import('./ClassesForm'), { loading: () => <p>Chargement...</p> });
const SubjectsForm = dynamic(() => import('./SubjectsForm'), { loading: () => <p>Chargement...</p> });
const TeachersForm = dynamic(() => import('./TeachersForm'), { loading: () => <p>Chargement...</p> });
const ClassroomsForm = dynamic(() => import('./ClassroomsForm'), { loading: () => <p>Chargement...</p> });
const ConstraintsForm = dynamic(() => import('./ConstraintsForm'), { loading: () => <p>Chargement...</p> });
const ValidationStep = dynamic(() => import('./ValidationStep'), { loading: () => <p>Chargement...</p> });
const ScheduleEditor = dynamic(() => import('../schedule/ScheduleEditor'), { loading: () => <p>Chargement...</p> });

const steps = [
  { id: 'school', title: 'Établissement', icon: School, description: 'Paramètres généraux' },
  { id: 'classes', title: 'Classes', icon: Users, description: 'Définition des classes' },
  { id: 'subjects', title: 'Matières', icon: BookOpen, description: 'Horaires par classe' },
  { id: 'teachers', title: 'Professeurs', icon: Calendar, description: 'Gestion des enseignants' },
  { id: 'rooms', title: 'Salles', icon: MapPin, description: 'Déclaration des espaces' },
  { id: 'constraints', title: 'Contraintes', icon: Puzzle, description: 'Indisponibilités et exigences' },
  { id: 'validation', title: 'Génération', icon: CheckCircle, description: 'Vérification et génération' }
];

export default function ShuddlePageClient() {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    
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
    const saveStatus = useAppSelector(selectSaveStatus);
    const lastSaved = useAppSelector(selectLastSaved);
    
    useEffect(() => {
      if (scheduleStatus === 'succeeded' && !initialModeSet) {
        setMode(schedule.length > 0 ? 'edit' : 'wizard');
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

    const handleSaveProgress = () => {
        dispatch(saveScheduleDraft())
          .unwrap()
          .then(() => {
            toast({
                title: "Progression sauvegardée",
                description: "Votre configuration a été enregistrée sur le serveur.",
            });
          })
          .catch((error) => {
             toast({
                variant: "destructive",
                title: "Échec de la sauvegarde",
                description: error,
            });
          });
    };

    const getSaveButtonContent = () => {
        if (saveStatus === 'loading') {
            return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sauvegarde...</>;
        }
        if (saveStatus === 'succeeded' && lastSaved) {
            return <><CheckCircle className="mr-2 h-4 w-4" /> Sauvegardé</>;
        }
        return <><Save className="mr-2 h-4 w-4" /> Sauvegarder la Progression</>;
    };

    const handleGenerationSuccess = () => setMode('edit');

    const renderStepContent = () => {
        switch (steps[currentStep].id) {
          case 'school': return <SchoolConfigForm />;
          case 'classes': return <ClassesForm data={classes} grades={grades} />;
          case 'subjects': return <SubjectsForm data={subjects} classes={classes} />;
          case 'teachers': return <TeachersForm />;
          case 'rooms': return <ClassroomsForm data={rooms} />;
          case 'constraints': return <ConstraintsForm />;
          case 'validation': return <ValidationStep wizardData={wizardData} onGenerationSuccess={handleGenerationSuccess} />;
          default: return null;
        }
    };

    const progress = ((currentStep + 1) / steps.length) * 100;
    
    if (scheduleStatus === 'idle') {
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
                                <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}><ChevronLeft size={16} className="mr-2" /> Précédent</Button>
                                <div className="flex items-center gap-2">
                                    {lastSaved && <span className="text-xs text-muted-foreground">Dernière sauvegarde: {format(new Date(lastSaved), 'HH:mm:ss', { locale: fr })}</span>}
                                    <Button onClick={handleSaveProgress} variant="secondary" disabled={saveStatus === 'loading'}>{getSaveButtonContent()}</Button>
                                </div>
                                <Button onClick={handleNext} disabled={currentStep === steps.length - 1}>Suivant <ChevronRight size={16} className="ml-2" /></Button>
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
