// src/components/wizard/forms/ImportConfigDialog.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import Papa from 'papaparse';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// UI Components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle, List, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


// Redux Actions
import { setAllSubjects } from '@/lib/redux/features/subjects/subjectsSlice';
import { setAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { fetchAllDrafts, activateDraft, deleteDraft, selectAllDrafts } from '@/lib/redux/features/scheduleDraftSlice';
import type { Grade, TeacherWithDetails, Subject, ClassWithGrade, UserSex, ScheduleDraft } from '@/types'; 

// Schemas for validation
const subjectSchema = z.object({
  name: z.string().min(1),
  weeklyHours: z.coerce.number().min(0),
  coefficient: z.coerce.number().min(0),
});

const classSchema = z.object({
  name: z.string().min(1),
  gradeLevel: z.coerce.number().min(1),
  capacity: z.coerce.number().min(1),
});

const teacherSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  email: z.string().email(),
  subjects: z.string().optional(),
});

type ImportType = 'subjects' | 'classes' | 'teachers';

interface ImportConfigDialogProps {
  grades: Grade[];
}

const ImportConfigDialog: React.FC<ImportConfigDialogProps> = ({ grades }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<ImportType | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();

  const drafts = useAppSelector(selectAllDrafts);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAllDrafts());
    }
  }, [isOpen, dispatch]);


  const processFile = (file: File, type: ImportType) => {
    setLoading(type);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (type === 'subjects') {
            const parsedData = z.array(subjectSchema).parse(results.data);
            const subjects: Subject[] = parsedData.map((item, index) => ({
              id: -(Date.now() + index),
              name: item.name,
              weeklyHours: item.weeklyHours,
              coefficient: item.coefficient,
            }));
            dispatch(setAllSubjects(subjects));
            toast({ title: "Succès", description: `${subjects.length} matières importées.` });
          } else if (type === 'classes') {
            const parsedData = z.array(classSchema).parse(results.data);
            const classes: ClassWithGrade[] = parsedData.map((item, index) => {
              const grade = grades.find(g => g.level === item.gradeLevel);
              if (!grade) {
                throw new Error(`Niveau invalide "${item.gradeLevel}" pour la classe "${item.name}" à la ligne ${index + 2}.`);
              }
              return {
                id: -(Date.now() + index),
                name: item.name,
                abbreviation: `${item.gradeLevel}${item.name}`,
                capacity: item.capacity,
                gradeId: grade.id,
                grade: grade,
                _count: { students: 0, lessons: 0 },
              };
            });
            dispatch(setAllClasses(classes));
            toast({ title: "Succès", description: `${classes.length} classes importées.` });
          } else if (type === 'teachers') {
             toast({ variant: 'destructive', title: "Fonctionnalité non disponible", description: "L'importation des professeurs n'est pas supportée pour le moment en raison de la complexité de la gestion des utilisateurs (mots de passe, etc.)." });
          }
          setLoading(null);
          setIsOpen(false);
        } catch (e: any) {
          console.error("Erreur de parsing CSV:", e);
          const message = e instanceof z.ZodError ? "Le format du fichier est incorrect. Veuillez vérifier les colonnes et les types de données." : e.message;
          setError(message);
          setLoading(null);
        }
      },
      error: (err) => {
        setError(err.message);
        setLoading(null);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: ImportType) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, type);
    }
  };
  
  const handleLoad = async (draftId: string) => {
    await dispatch(activateDraft(draftId));
    toast({ title: 'Scénario activé', description: "Les données du scénario ont été chargées. La page va s'actualiser." });
    setIsOpen(false);
    router.refresh(); 
  };
  
  const handleDelete = async (draftId: string) => {
    await dispatch(deleteDraft(draftId));
    toast({ title: 'Scénario supprimé' });
  };


  const ImportTabContent = ({ type, title, headers, example }: { type: ImportType, title: string, headers: string, example: string }) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Importez vos {title.toLowerCase()} via un fichier CSV. Le fichier doit contenir les colonnes suivantes : <code className="bg-muted px-1 py-0.5 rounded-sm">{headers}</code>.
        <br />
        Exemple : <code className="bg-muted px-1 py-0.5 rounded-sm">{example}</code>
      </p>
      {error && type === loading && (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur d'importation</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-center">
        <label htmlFor={`csv-upload-${type}`} className="w-full">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                {loading === type ? (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <span className="text-muted-foreground">Traitement...</span>
                    </>
                ) : (
                    <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="font-semibold">Cliquez pour téléverser un fichier CSV</span>
                        <span className="text-xs text-muted-foreground">ou glissez-déposez le fichier ici</span>
                    </>
                )}
            </div>
            <input
                id={`csv-upload-${type}`}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileChange(e, type)}
                disabled={!!loading}
            />
        </label>
      </div>
    </div>
  );

  const LoadScenarioTabContent = () => (
    <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
            Sélectionnez un scénario sauvegardé pour l'activer et l'éditer. Vos modifications actuelles non sauvegardées seront perdues.
        </p>
        <ScrollArea className="max-h-[50vh] overflow-y-auto p-1 border rounded-lg">
            {drafts.length > 0 ? drafts.map((draft: ScheduleDraft) => (
                <div key={draft.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted">
                    <div>
                        <p className="font-semibold flex items-center gap-2">
                            {draft.name}
                            {draft.isActive && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </p>
                        <p className="text-sm text-muted-foreground">{draft.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleLoad(draft.id)} disabled={draft.isActive || !!loading}>
                            {draft.isActive ? 'Actif' : 'Charger'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button size="icon" variant="destructive" className="h-8 w-8" disabled={!!loading}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer définitivement le scénario "{draft.name}" ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(draft.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )) : <p className="text-center text-muted-foreground py-8">Aucun scénario sauvegardé.</p>}
        </ScrollArea>
    </div>
  );


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Importer / Charger</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer ou Charger une Configuration</DialogTitle>
          <DialogDescription>
            Accélérez la configuration en important vos données en masse ou en chargeant un scénario existant.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="load_scenario" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="load_scenario">Charger Scénario</TabsTrigger>
                <TabsTrigger value="subjects">Matières (CSV)</TabsTrigger>
                <TabsTrigger value="classes">Classes (CSV)</TabsTrigger>
                <TabsTrigger value="teachers">Professeurs (CSV)</TabsTrigger>
            </TabsList>
             <TabsContent value="load_scenario" className="pt-4">
                <LoadScenarioTabContent />
            </TabsContent>
            <TabsContent value="subjects" className="pt-4">
                <ImportTabContent type="subjects" title="Matières" headers="name, weeklyHours, coefficient" example="Mathématiques, 4, 2"/>
            </TabsContent>
            <TabsContent value="classes" className="pt-4">
                <ImportTabContent type="classes" title="Classes" headers="name, gradeLevel, capacity" example="7ème Base 1, 7, 30"/>
            </TabsContent>
            <TabsContent value="teachers" className="pt-4">
                <ImportTabContent type="teachers" title="Professeurs" headers="name, surname, email, subjects" example="Dupont, Jean, j.dupont@email.com, Mathématiques;Physique"/>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportConfigDialog;
