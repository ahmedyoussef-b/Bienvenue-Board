'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { saveScheduleDraft, selectSaveStatus, selectLastSaved } from '@/lib/redux/features/scheduleDraftSlice';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';

export default function SaveDraftButton() {
    const dispatch = useAppDispatch();
    const saveStatus = useAppSelector(selectSaveStatus);
    const lastSaved = useAppSelector(selectLastSaved);
    const { toast } = useToast();

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
                description: (resultAction.payload as string) ?? "Une erreur inconnue est survenue.",
            });
        }
    };

    return (
        <Card className="p-6 mt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">Sauvegarder votre progression</h3>
                    <p className="text-sm text-muted-foreground">
                        {lastSaved ? `Dernière sauvegarde : ${format(new Date(lastSaved), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}` : "Aucune sauvegarde pour le moment."}
                    </p>
                </div>
                <Button onClick={handleSaveDraft} disabled={saveStatus === 'loading'}>
                    {saveStatus === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Sauvegarder le brouillon
                </Button>
            </div>
        </Card>
    );
}
