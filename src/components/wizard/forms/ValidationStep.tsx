// src/components/wizard/forms/ValidationStep.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { CheckCircle, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { setInitialSchedule } from '@/lib/redux/features/schedule/scheduleSlice';
import { generateSchedule } from '@/lib/schedule-utils';
import { useToast } from '@/hooks/use-toast';
import { WizardData } from '@/types/ wizard-types';

interface ValidationStepProps {
  wizardData: WizardData;
  onGenerationSuccess: () => void;
}

interface ValidationResult {
    type: 'success' | 'warning' | 'error';
    message: string;
    details?: string;
}

const ValidationStep: React.FC<ValidationStepProps> = ({ 
  wizardData, 
  onGenerationSuccess 
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const validateData = useCallback(() => {
    const results: ValidationResult[] = [];
    const { school, classes, teachers, subjects, lessonRequirements, teacherAssignments } = wizardData;
    
    // Basic data presence checks
    if (!school.name) results.push({ type: 'error', message: "Nom d'établissement manquant." });
    if (classes.length === 0) results.push({ type: 'error', message: 'Aucune classe configurée.' });
    if (teachers.length === 0) results.push({ type: 'error', message: 'Aucun enseignant configuré.' });
    if (subjects.length === 0) results.push({ type: 'error', message: 'Aucune matière configurée.' });
    if (results.some(r => r.type === 'error')) return results;

    // Advanced consistency checks
    lessonRequirements.forEach(req => {
        if (req.hours > 0) {
            const assignmentExists = teacherAssignments.some(a => a.classIds.includes(req.classId) && a.subjectId === req.subjectId);
            if (!assignmentExists) {
                const className = classes.find(c => c.id === req.classId)?.name;
                const subjectName = subjects.find(s => s.id === req.subjectId)?.name;
                results.push({
                    type: 'error',
                    message: `Matière non assignée`,
                    details: `La matière "${subjectName}" requise pour la classe "${className}" n'a pas de professeur assigné.`
                });
            }
        }
    });

    const totalSchoolHours = (school.schoolDays?.length || 0) * (generateTimeSlots(school.startTime, school.endTime, school.sessionDuration).length);
    classes.forEach(cls => {
        const totalRequiredHours = lessonRequirements
            .filter(r => r.classId === cls.id)
            .reduce((sum, r) => sum + r.hours, 0);
        
        if (totalRequiredHours > totalSchoolHours) {
            results.push({
                type: 'warning',
                message: 'Classe surchargée',
                details: `La classe "${cls.name}" a ${totalRequiredHours} heures de cours requises, mais seulement ${totalSchoolHours} créneaux sont disponibles par semaine.`
            });
        }
    });

    
    if (results.every(r => r.type !== 'error')) {
      results.unshift({ 
        type: 'success', 
        message: 'Configuration de base valide et prête pour la génération.' 
      });
    }
    
    return results;
  }, [wizardData]);

  useEffect(() => {
    setValidationResults(validateData());
  }, [wizardData, validateData]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    setGenerationProgress(20);
    
    // Use a try-catch block to handle potential errors during generation
    try {
        const finalSchedule = generateSchedule(wizardData);
        await new Promise(resolve => setTimeout(resolve, 500));
        setGenerationProgress(100);

        dispatch(setInitialSchedule(finalSchedule));
        setIsGenerated(true);
        toast({
          title: "Génération terminée !",
          description: "Les emplois du temps ont été générés avec succès. Vous pouvez maintenant les éditer."
        });
        onGenerationSuccess();

    } catch (error) {
        console.error("Schedule Generation Error:", error);
        toast({
            variant: 'destructive',
            title: "Erreur de Génération",
            description: "Une erreur est survenue. Vérifiez les contraintes et réessayez."
        });
    } finally {
        setIsGenerating(false);
    }
  };

  const canGenerate = validationResults.every(result => result.type !== 'error');

  const getValidationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'error': return <AlertTriangle className="text-destructive" size={20} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <CheckCircle className="text-primary" size={20} />
          <span>Validation de la configuration</span>
        </h3>
        
        <div className="space-y-3">
          {validationResults.map((result, index) => (
            <Alert 
              key={index} 
              variant={result.type === 'error' ? 'destructive' : 'default'}
              className={`border-l-4 ${
                result.type === 'success' 
                  ? 'border-green-500 bg-green-500/10' 
                  : result.type === 'warning' 
                    ? 'border-yellow-500 bg-yellow-500/10' 
                    : 'border-destructive bg-destructive/10'
              }`}
            >
              <div className="flex items-start space-x-3">
                {getValidationIcon(result.type)}
                <div className="flex-1">
                  <AlertTitle className={`font-semibold ${
                      result.type === 'success' ? 'text-green-700 dark:text-green-400'
                      : result.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400'
                      : 'text-destructive'
                  }`}>
                    {result.message}
                  </AlertTitle>
                  {result.details && (
                    <AlertDescription className="text-sm text-muted-foreground mt-1">
                      {result.details}
                    </AlertDescription>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Calendar className="text-primary" size={20} />
          <span>Génération des emplois du temps</span>
        </h3>
        
        {isGenerating ? (
          <div className="space-y-4">
            <Progress value={generationProgress} className="h-3" />
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Clock size={20} className="animate-spin" />
              <span>Génération en cours... {Math.round(generationProgress)}%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!canGenerate && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Veuillez corriger les erreurs de configuration avant de lancer la génération.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleGenerate} 
                disabled={!canGenerate} 
                className="flex-1" 
                size="lg"
              >
                <Calendar size={20} className="mr-2" />
                Générer l'emploi du temps
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ValidationStep;
