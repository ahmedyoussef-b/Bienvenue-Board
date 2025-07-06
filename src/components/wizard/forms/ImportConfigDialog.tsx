// src/components/wizard/forms/ImportConfigDialog.tsx

'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import Papa from 'papaparse';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


// Redux Actions
import { setAllSubjects } from '@/lib/redux/features/subjects/subjectsSlice';
import { setAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { type Grade, type TeacherWithDetails, type Subject, type ClassWithGrade, UserSex } from '@/types'; 

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
  const { toast } = useToast();

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Importer la configuration</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer depuis un fichier CSV</DialogTitle>
          <DialogDescription>
            Accélérez la configuration en important vos données en masse. Choisissez une catégorie pour commencer.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="subjects" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="subjects">Matières</TabsTrigger>
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="teachers">Professeurs</TabsTrigger>
            </TabsList>
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
