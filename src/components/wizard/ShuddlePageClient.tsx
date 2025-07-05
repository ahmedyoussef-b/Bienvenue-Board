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
