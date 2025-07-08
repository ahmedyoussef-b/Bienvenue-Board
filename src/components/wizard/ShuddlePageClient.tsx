// src/components/wizard/ShuddlePageClient.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { cn } from '@/lib/utils';
import { Loader2, ChevronLeft, ChevronRight, FilePlus, Sparkles, AlertTriangle } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

// Components
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ScheduleEditor from '../schedule/ScheduleEditor';

// Hooks & Redux
import useWizardData from '@/hooks/useWizardData';
import useWizardSteps from '@/hooks/useWizardSteps';
import { selectSchedule, selectScheduleStatus } from '@/lib/redux/features/schedule/scheduleSlice';
import { selectActiveDraft, selectDraftStatus, createDraft, updateActiveDraft, selectSaveStatus } from '@/lib/redux/features/scheduleDraftSlice';
import { useToast } from '@/hooks/use-toast';

const ShuddlePageClient: React.FC = () => {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const [mode, setMode] = useState<'wizard' | 'edit'>('wizard');

    // Selectors
    const activeDraft = useAppSelector(selectActiveDraft);
    const draftStatus = useAppSelector(selectDraftStatus);
    const schedule = useAppSelector(selectSchedule);
    const scheduleStatus = useAppSelector(selectScheduleStatus);
    const saveStatus = useAppSelector(selectSaveStatus);

    // Custom hooks
    const wizardData = useWizardData();
    const { steps, currentStep, progress, handleNext, handlePrevious, handleStepClick } = useWizardSteps();
    
    // --- AUTOSAVE LOGIC ---
    const debouncedSave = useDebouncedCallback(() => {
        if (draftStatus === 'succeeded' && activeDraft) {
            dispatch(updateActiveDraft());
        }
    }, 2000); // Autosave 2 seconds after the last change

    // Serialize data to a string for stable comparison.
    const wizardDataString = JSON.stringify(wizardData);

    useEffect(() => {
        if (draftStatus === 'succeeded' && activeDraft) {
            debouncedSave();
        }
    }, [wizardDataString, activeDraft?.name, activeDraft?.description, debouncedSave, draftStatus, activeDraft]);
    // --- END AUTOSAVE LOGIC ---


    // Set initial mode based on schedule data
    useEffect(() => {
        if (draftStatus === 'succeeded' && scheduleStatus === 'succeeded') {
            setMode(schedule && schedule.length > 0 ? 'edit' : 'wizard');
        }
    }, [schedule, scheduleStatus, draftStatus]);

    const handleGenerationSuccess = () => setMode('edit');

    const renderStepContent = () => {
        const StepComponent = steps[currentStep].component;
        return <StepComponent 
            wizardData={wizardData} 
            onGenerationSuccess={handleGenerationSuccess} 
        />;
    };

    if (draftStatus === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Chargement de votre configuration...</p>
            </div>
        );
    }
    
    // If loading is done and there's no active draft, prompt to create one.
    if (draftStatus === 'succeeded' && !activeDraft) {
        return <CreateFirstScenarioDialog />;
    }

    const renderWizard = () => (
        <>
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-foreground truncate pr-4">
                       Scénario: <span className="text-primary">{activeDraft?.name || 'Nouveau Scénario'}</span>
                       {saveStatus === 'loading' && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />}
                    </h2>
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
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

// --- Sub-components for better readability ---

const CreateFirstScenarioDialog = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsLoading(true);
        await dispatch(createDraft({ name, description }));
        setIsLoading(false);
    };

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Bienvenue dans le planificateur !</DialogTitle>
                    <DialogDescription>
                        Pour commencer, veuillez nommer votre premier scénario d'emploi du temps.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="scenario-name">Nom du scénario</Label>
                        <Input id="scenario-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Année scolaire 2024-2025"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="scenario-desc">Description (Optionnel)</Label>
                        <Input id="scenario-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Configuration principale"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={!name.trim() || isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
                        Créer et commencer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

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
    onPrevious: () => void;
    onNext: () => void;
    currentStep: number;
    stepsLength: number;
}> = ({ 
    onPrevious, 
    onNext, 
    currentStep, 
    stepsLength 
}) => (
    <div className="flex justify-end items-center mt-auto">
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
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center justify-center gap-3">
            <Sparkles className="text-primary"/>
            Planificateur d'Emplois du Temps
        </h1>
        <p className="text-lg text-muted-foreground">
            Assistant intelligent pour la planification scolaire
        </p>
    </div>
);

export default ShuddlePageClient;
