// src/components/wizard/ScenarioManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { createDraft, selectSaveStatus } from '@/lib/redux/features/scheduleDraftSlice';

export default function ScenarioManager() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');

  const saveStatus = useAppSelector(selectSaveStatus);

  const handleSaveAs = async () => {
    if (!draftName) {
      toast({ variant: 'destructive', title: 'Nom requis', description: 'Veuillez donner un nom à votre nouveau scénario.' });
      return;
    }
    await dispatch(createDraft({ name: draftName, description: draftDescription }));
    toast({ title: 'Scénario sauvegardé !', description: `Le scénario "${draftName}" a été enregistré comme une nouvelle version.` });
    setIsSaveAsOpen(false);
    setDraftName('');
    setDraftDescription('');
  };

  return (
    <Dialog open={isSaveAsOpen} onOpenChange={setIsSaveAsOpen}>
        <DialogTrigger asChild>
        <Button>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder sous...
        </Button>
        </DialogTrigger>
        <DialogContent>
        <DialogHeader>
            <DialogTitle>Sauvegarder sous un nouveau nom</DialogTitle>
            <DialogDescription>Créez une nouvelle copie de votre configuration actuelle. Cela n'affectera pas votre scénario de travail.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
            <Label htmlFor="draft-name">Nom du nouveau scénario</Label>
            <Input id="draft-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
            </div>
            <div className="space-y-2">
            <Label htmlFor="draft-desc">Description (Optionnel)</Label>
            <Input id="draft-desc" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} />
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveAsOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveAs} disabled={saveStatus === 'loading'}>
                {saveStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sauvegarder la copie
            </Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
