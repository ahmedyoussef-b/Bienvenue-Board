// src/components/admin/ReplacementFinder.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Wand2, Loader2, AlertTriangle, User, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { findReplacementTeacher, type FindReplacementTeacherOutput } from '@/ai/flows/find-replacement-teacher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


interface ReplacementFinderProps {
  teachers: { id: string; name: string; surname: string }[];
}

export default function ReplacementFinder({ teachers }: ReplacementFinderProps) {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<FindReplacementTeacherOutput | null>(null);
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!selectedTeacherId || !selectedDate) {
            toast({
                variant: 'destructive',
                title: 'Informations manquantes',
                description: 'Veuillez sélectionner un professeur et une date.',
            });
            return;
        }

        setIsLoading(true);
        setResults(null);

        try {
            const dateString = format(selectedDate, 'yyyy-MM-dd');
            const response = await findReplacementTeacher({ absentTeacherId: selectedTeacherId, date: dateString });
            setResults(response);
            if (response.suggestions.length === 0) {
                 toast({
                    title: 'Aucun cours trouvé',
                    description: 'Le professeur sélectionné n\'a aucun cours prévu à cette date.',
                });
            }
        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erreur de l\'IA',
                description: error.message || "Une erreur est survenue lors de la recherche de remplaçants.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="text-sm font-medium">Professeur absent</label>
                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner un professeur..." />
                        </SelectTrigger>
                        <SelectContent>
                            {teachers.map(teacher => (
                                <SelectItem key={teacher.id} value={teacher.id}>{teacher.name} {teacher.surname}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium">Date de l'absence</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !selectedDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus /></PopoverContent>
                    </Popover>
                </div>
                <Button onClick={handleSearch} disabled={isLoading} className="h-10">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Recherche...' : 'Trouver des remplaçants'}
                </Button>
            </div>

            {results && (
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Résultats de la recherche</h3>
                    {results.suggestions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.suggestions.map((suggestion, index) => (
                                <Card key={index} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle>{suggestion.lessonName}</CardTitle>
                                        <CardDescription>{suggestion.startTime} - {suggestion.endTime}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {suggestion.suggestedReplacements.length > 0 ? (
                                            <div className="space-y-3">
                                                {suggestion.suggestedReplacements.map(rep => (
                                                    <div key={rep.teacherId} className="p-3 bg-green-500/10 rounded-lg">
                                                        <p className="font-semibold flex items-center gap-2"><User size={14} />{rep.name}</p>
                                                        <p className="text-xs text-muted-foreground italic mt-1">"{rep.reason}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-yellow-500/10 rounded-lg h-full flex items-center">
                                                <div>
                                                    <p className="font-semibold flex items-center gap-2"><AlertTriangle size={14} />Alternative</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{suggestion.alternativeSolution}</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-10 text-muted-foreground">
                            <p>Le professeur sélectionné n'a pas de cours prévu pour cette date.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
