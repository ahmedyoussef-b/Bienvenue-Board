// src/components/chatroom/dashboard/TemplateSelector.tsx
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, BarChart3, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionTemplate } from '@/lib/redux/slices/sessionSlice';
import { SESSION_TEMPLATES } from '@/lib/constants';

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string | null) => void;
}

export default function TemplateSelector({ selectedTemplateId, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Étape 1: Choisir un modèle (Optionnel)</CardTitle>
        <CardDescription>
          Sélectionnez un modèle pour pré-charger des quiz et des sondages dans votre session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SESSION_TEMPLATES.map((template) => {
            const isSelected = selectedTemplateId === template.id;
            return (
              <Card
                key={template.id}
                onClick={() => onSelectTemplate(isSelected ? null : template.id)}
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-md',
                  isSelected && 'ring-2 ring-primary border-primary bg-primary/5'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold">
                      {template.name}
                    </CardTitle>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="flex gap-2">
                    {template.quizzes.length > 0 && (
                      <Badge variant="outline">
                        <Brain className="w-3 h-3 mr-1" />
                        {template.quizzes.length} Quiz
                      </Badge>
                    )}
                    {template.polls.length > 0 && (
                      <Badge variant="outline">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        {template.polls.length} Sondage
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
