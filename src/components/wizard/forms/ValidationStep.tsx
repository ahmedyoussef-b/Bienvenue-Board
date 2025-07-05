// src/components/wizard/forms/ValidationStep.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { CheckCircle, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { setInitialSchedule } from '@/lib/redux/features/schedule/scheduleSlice';
import { generateSchedule } from '@/lib/schedule-utils';
import { useToast } from '@/hooks/use-toast';
import type { WizardData } from '@/types/wizard-types';

interface ValidationStepProps {
  wizardData: WizardData;
  onGenerationSuccess: () => void;
}

const ValidationStep: React.FC<ValidationStepProps> = ({ 
  wizardData, 
  onGenerationSuccess 
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const validateData = useCallback(() => {
    const results: any[] = [];
    
    if (!wizardData.school.name) {
      results.push({ 
        type: 'error', 
        message: "Nom d'établissement manquant" 
      });
    }
    
    if (wizardData.classes.length === 0) {
      results.push({ 
        type: 'error', 
        message: 'Aucune classe configurée' 
      });
    }
    
    if (wizardData.teachers.length === 0) {
      results.push({ 
        type: 'error', 
        message: 'Aucun enseignant configuré' 
      });
    }
    
    if (wizardData.subjects.length === 0) {
      results.push({ 
        type: 'error', 
        message: 'Aucune matière configurée' 
      });
    }
    
    if (results.every(r => r.type !== 'error')) {
      results.push({ 
        type: 'success', 
        message: 'Configuration valide' 
      });
    }
    
    return results;
  }, [wizardData]);

  useEffect(() => {
    setValidationResults(validateData());
  }, [wizardData, validateData]);

  const simulateGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    const steps = [
      'Analyse...', 
      'Calcul des créneaux...', 
      'Assignation...', 
      'Optimisation...', 
      'Validation finale...', 
      'Terminé !'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationProgress(((i + 1) / steps.length) * 100);
    }
    
    const finalSchedule = generateSchedule(wizardData);
    dispatch(setInitialSchedule(finalSchedule));
    
    setIsGenerating(false);
    setIsGenerated(true);
    
    toast({
      title: "Génération terminée !",
      description: "Les emplois du temps ont été générés."
    });
    
    onGenerationSuccess();
  };

  const canGenerate = validationResults.every(result => result.type !== 'error');

  const getValidationIcon = (type: string) => {
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
                  <AlertDescription>
                    <p className={`font-medium ${
                      result.type === 'success' 
                        ? 'text-green-700 dark:text-green-400' 
                        : result.type === 'warning' 
                          ? 'text-yellow-700 dark:text-yellow-400' 
                          : 'text-destructive'
                    }`}>
                      {result.message}
                    </p>
                    {result.details && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.details}
                      </p>
                    )}
                  </AlertDescription>
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
                onClick={simulateGeneration} 
                disabled={!canGenerate} 
                className="flex-1" 
                size="lg"
              >
                <Calendar size={20} className="mr-2" />
                Générer l'emploi du temps
              </Button>
            </div>
            
            {canGenerate && !isGenerated && (
              <div className="p-4 bg-green-500/10 rounded-lg mt-4">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✅ Configuration validée ! La génération peut être lancée.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ValidationStep;
