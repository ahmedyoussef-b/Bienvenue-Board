// src/components/wizard/forms/SchoolConfigForm.tsx
'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { School, Clock, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { updateSchoolConfig, selectSchoolConfig } from '@/lib/redux/features/schoolConfigSlice';
import { updateActiveDraftDetails, selectActiveDraft } from '@/lib/redux/features/scheduleDraftSlice';
import { Loader2 } from 'lucide-react';
import ImportConfigDialog from './ImportConfigDialog';
import { WizardData } from '@/types/ wizard-types';

interface SchoolConfigFormProps {
  wizardData: WizardData;
}

const SchoolConfigForm: React.FC<SchoolConfigFormProps> = ({ wizardData }) => {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectSchoolConfig);
  const activeDraft = useAppSelector(selectActiveDraft);

  const handleSchoolConfigChange = (field: keyof typeof data, value: any) => {
    dispatch(updateSchoolConfig({ [field]: value }));
  };
  
  const handleDraftDetailsChange = (field: 'name' | 'description', value: string) => {
    dispatch(updateActiveDraftDetails({ [field]: value }));
  };
  
  const dayOptions = [
    { id: 'monday', label: 'Lundi' }, 
    { id: 'tuesday', label: 'Mardi' }, 
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' }, 
    { id: 'friday', label: 'Vendredi' }, 
    { id: 'saturday', label: 'Samedi' }
  ];

  const handleDayToggle = (dayId: string, checked: boolean) => {
    const newDays = checked 
      ? [...data.schoolDays, dayId]
      : data.schoolDays.filter(day => day !== dayId);
    handleSchoolConfigChange('schoolDays', newDays);
  };

  if (!data || !activeDraft) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
       <div className="flex justify-end">
        <ImportConfigDialog grades={wizardData.grades} />
      </div>
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <School className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Configuration du scénario et de l'établissement</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="scenarioName">Nom du scénario</Label>
            <Input 
              id="scenarioName" 
              value={activeDraft.name} 
              onChange={(e) => handleDraftDetailsChange('name', e.target.value)} 
              placeholder="Année scolaire 2024-2025" 
              className="mt-1" 
            />
          </div>
           <div>
            <Label htmlFor="scenarioDesc">Description du scénario (Optionnel)</Label>
            <Input 
              id="scenarioDesc" 
              value={activeDraft.description || ''} 
              onChange={(e) => handleDraftDetailsChange('description', e.target.value)} 
              placeholder="Configuration principale avec contraintes..." 
              className="mt-1" 
            />
          </div>
           <div>
            <Label htmlFor="schoolName">Nom de l'établissement</Label>
            <Input 
              id="schoolName" 
              value={data.name} 
              onChange={(e) => handleSchoolConfigChange('name', e.target.value)} 
              placeholder="Collège Riadh 5" 
              className="mt-1" 
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Configuration horaire</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startTime">Heure de début</Label>
            <Input 
              id="startTime" 
              type="time" 
              value={data.startTime} 
              onChange={(e) => handleSchoolConfigChange('startTime', e.target.value)} 
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="endTime">Heure de fin</Label>
            <Input 
              id="endTime" 
              type="time" 
              value={data.endTime} 
              onChange={(e) => handleSchoolConfigChange('endTime', e.target.value)} 
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="sessionDuration">Durée d'une séance (minutes)</Label>
            <Select 
              value={data.sessionDuration.toString()} 
              onValueChange={(value) => handleSchoolConfigChange('sessionDuration', parseInt(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="50">50 minutes</SelectItem>
                <SelectItem value="55">55 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="90">1h30</SelectItem>
                <SelectItem value="120">2 heures</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Jours de cours</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {dayOptions.map((day) => (
            <div key={day.id} className="flex items-center space-x-2">
              <Checkbox 
                id={day.id} 
                checked={data.schoolDays.includes(day.id)} 
                onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)} 
              />
              <Label htmlFor={day.id} className="text-sm font-medium">
                {day.label}
              </Label>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary">
            <strong>Sélectionnés:</strong> {data.schoolDays.length} jour(s) de cours par semaine
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SchoolConfigForm;
