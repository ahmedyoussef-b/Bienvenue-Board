// src/components/wizard/ClassesForm.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import type { ClassWithGrade, CreateClassPayload, Grade } from '@/types';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { localAddClass, localDeleteClass } from '@/lib/redux/features/classes/classesSlice';
import { useToast } from '@/hooks/use-toast';

interface ClassesFormProps {
  data: ClassWithGrade[];
  grades: Grade[];
}

const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F'];

const ClassesForm: React.FC<ClassesFormProps> = ({ data, grades }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [newClass, setNewClass] = useState({
    gradeLevel: 0,
    section: '',
    capacity: 25,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleAddClass = () => {
    if (!newClass.gradeLevel || !newClass.section || !newClass.capacity) return;

    const selectedGrade = grades.find(g => g.level === newClass.gradeLevel);
    if (!selectedGrade) {
      toast({
        variant: "destructive",
        title: "Erreur de configuration",
        description: "Le niveau sélectionné est invalide.",
      });
      return;
    }

    const newClassName = `Niveau ${selectedGrade.level} - ${newClass.section}`;
    const classExists = data.some(cls => cls.name.trim().toLowerCase() === newClassName.trim().toLowerCase());

    if (classExists) {
        toast({
            variant: "destructive",
            title: "Classe existante",
            description: `La classe "${newClassName}" existe déjà.`,
        });
        return;
    }
    
    // Dispatch local action instead of API call
    dispatch(localAddClass({
        id: -Date.now(), // Temporary negative ID for client-side
        name: newClassName,
        abbreviation: `${selectedGrade.level}${newClass.section}`,
        capacity: newClass.capacity,
        gradeId: selectedGrade.id,
        supervisorId: null,
        grade: selectedGrade,
        _count: { students: 0, lessons: 0 }
    }));
    
    toast({
      title: 'Classe ajoutée (Brouillon)',
      description: `La classe "${newClassName}" a été ajoutée à votre configuration.`,
    });
    setNewClass({ gradeLevel: 0, section: '', capacity: 25 });
  };

  const handleDeleteClass = (id: number) => {
    dispatch(localDeleteClass(id));
     toast({
        title: 'Classe supprimée (Brouillon)',
        description: `La classe a été supprimée de votre configuration.`,
      });
  };

  const handleEditClass = (id: number) => {
    setEditingId(id);
    toast({ title: 'Info', description: "La fonction d'édition n'est pas encore implémentée." });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Ajouter une classe</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Niveau</Label>
            <Select 
              value={newClass.gradeLevel ? String(newClass.gradeLevel) : ''}
              onValueChange={(value) => setNewClass({...newClass, gradeLevel: parseInt(value, 10)})}
              disabled={isAdding}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choisir un niveau" />
              </SelectTrigger>
              <SelectContent>
                {grades.map(grade => (
                  <SelectItem key={grade.id} value={String(grade.level)}>{`Niveau ${grade.level}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Section</Label>
            <Select 
              value={newClass.section} 
              onValueChange={(value) => setNewClass({...newClass, section: value})}
              disabled={isAdding}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {sectionOptions.map(section => (
                  <SelectItem key={section} value={section}>{section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Nombre d'élèves</Label>
            <Input
              type="number"
              value={newClass.capacity}
              onChange={(e) => setNewClass({...newClass, capacity: parseInt(e.target.value) || 0})}
              min="1"
              max="40"
              className="mt-1"
              disabled={isAdding}
            />
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={handleAddClass}
              disabled={!newClass.gradeLevel || !newClass.section || !newClass.capacity || isAdding}
              className="w-full"
            >
              {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAdding ? 'Ajout en cours...' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Classes configurées ({data.length})</h3>
        </div>
        
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users size={48} className="mx-auto mb-4 text-muted" />
            <p>Aucune classe configurée</p>
            <p className="text-sm">Commencez par ajouter votre première classe</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((cls) => (
              <Card key={cls.id} className="p-4 hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{cls.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {cls.capacity} élèves
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClass(cls.id)}
                        disabled
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClass(cls.id)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Niveau: {cls.grade?.level || 'N/A'}</span>
                    <span>Section: {cls.abbreviation}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {data.length > 0 && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="text-lg font-semibold text-primary mb-3">Statistiques</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-primary/90">
            <div>
              <p className="font-medium">Total classes</p>
              <p className="text-2xl font-bold">{data.length}</p>
            </div>
            <div>
              <p className="font-medium">Total élèves</p>
              <p className="text-2xl font-bold">
                {data.reduce((sum, cls) => sum + cls.capacity, 0)}
              </p>
            </div>
            <div>
              <p className="font-medium">Niveaux différents</p>
              <p className="text-2xl font-bold">
                {new Set(data.map(cls => cls.grade?.level)).size}
              </p>
            </div>
            <div>
              <p className="font-medium">Effectif moyen</p>
              <p className="text-2xl font-bold">
                {data.length > 0 ? Math.round(data.reduce((sum, cls) => sum + cls.capacity, 0) / data.length) : 0}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClassesForm;
