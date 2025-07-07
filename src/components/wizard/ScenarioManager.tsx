// src/components/wizard/ScenarioManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload, Trash2, CheckCircle, List } from 'lucide-react';
import { createDraft, fetchAllDrafts, deleteDraft, activateDraft, selectAllDrafts, selectSaveStatus, selectLastSaved } from '@/lib/redux/features/scheduleDraftSlice';
import { useRouter } from 'next/navigation';
import type { ScheduleDraft } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export default function ScenarioManager() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();

  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');

  const drafts = useAppSelector(selectAllDrafts);
  const saveStatus = useAppSelector(selectSaveStatus);
  const lastSaved = useAppSelector(selectLastSaved);

  useEffect(() => {
    dispatch(fetchAllDrafts());
  }, [dispatch]);

  const handleSave = async () => {
    if (!draftName) {
      toast({ variant: 'destructive', title: 'Nom requis', description: 'Veuillez donner un nom à votre scénario.' });
      return;
    }
    await dispatch(createDraft({ name: draftName, description: draftDescription }));
    toast({ title: 'Scénario sauvegardé !', description: `Le scénario "${draftName}" a été enregistré.` });
    setIsSaveOpen(false);
    setDraftName('');
    setDraftDescription('');
  };

  const handleDelete = async (draftId: string) => {
    await dispatch(deleteDraft(draftId));
    toast({ title: 'Scénario supprimé' });
  };
  
  const handleLoad = async (draftId: string) => {
    await dispatch(activateDraft(draftId));
    toast({ title: 'Scénario activé', description: "Les données du scénario ont été chargées. La page va s'actualiser." });
    setIsLoadOpen(false);
    // Reload the page to make ShuddleInitializer re-run with the new active draft
    router.refresh(); 
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List size={20} />
          Gestion des Scénarios
        </CardTitle>
        <CardDescription>
          Sauvegardez, chargez et gérez différentes configurations d'emploi du temps.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-2">
        <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder le scénario actuel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sauvegarder le scénario</DialogTitle>
              <DialogDescription>Donnez un nom à votre configuration actuelle pour la retrouver plus tard.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="draft-name">Nom du scénario</Label>
                <Input id="draft-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="draft-desc">Description (Optionnel)</Label>
                <Input id="draft-desc" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsSaveOpen(false)}>Annuler</Button>
                <Button onClick={handleSave} disabled={saveStatus === 'loading'}>
                    {saveStatus === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sauvegarder
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isLoadOpen} onOpenChange={setIsLoadOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                    <Upload className="mr-2 h-4 w-4" />
                    Charger un scénario
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Charger un Scénario</DialogTitle>
                  <DialogDescription>Sélectionnez un scénario sauvegardé pour l'activer et l'éditer.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                    {drafts.length > 0 ? drafts.map(draft => (
                        <div key={draft.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted">
                            <div>
                                <p className="font-semibold flex items-center gap-2">
                                    {draft.name}
                                    {draft.isActive && <CheckCircle className="h-4 w-4 text-green-500" />}
                                </p>
                                <p className="text-sm text-muted-foreground">{draft.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleLoad(draft.id)} disabled={draft.isActive}>
                                    {draft.isActive ? 'Actif' : 'Charger'}
                                </Button>
                                <Button size="icon" variant="destructive" onClick={() => handleDelete(draft.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )) : <p className="text-center text-muted-foreground py-8">Aucun scénario sauvegardé.</p>}
                </div>
            </DialogContent>
        </Dialog>

      </CardContent>
      {lastSaved && (
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Dernière sauvegarde automatique : {new Date(lastSaved).toLocaleString('fr-FR')}
            </p>
        </CardFooter>
      )}
    </Card>
  );
}
