// src/components/wizard/ClassroomsForm.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Trash2, Monitor, FlaskConical, Dumbbell, School, Loader2 } from 'lucide-react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { localAddClassroom, localDeleteClassroom } from '@/lib/redux/features/classrooms/classroomsSlice';
import type { Classroom, CreateClassroomPayload } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ClassroomsFormProps {
  data: Classroom[];
}

const ClassroomsForm: React.FC<ClassroomsFormProps> = ({ data }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [newRoom, setNewRoom] = useState<Omit<CreateClassroomPayload, 'id'>>({
    name: '',
    abbreviation: '',
    capacity: 30,
    building: 'A'
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddRoom = () => {
    if (!newRoom.name || !newRoom.capacity) return;
    
    dispatch(localAddClassroom({
      id: -Date.now(), // Temporary client-side ID
      ...newRoom
    }));

    toast({
      title: 'Salle ajoutée (Brouillon)',
      description: `La salle "${newRoom.name}" a été ajoutée à votre configuration.`,
    });
    setNewRoom({ name: '', abbreviation: '', capacity: 30, building: 'A' });
  };

  const handleDeleteRoom = (id: number) => {
    dispatch(localDeleteClassroom(id));
     toast({
      title: 'Salle supprimée (Brouillon)',
      description: `La salle a été supprimée de votre configuration.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Ajouter une salle</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nom de la salle</Label>
              <Input
                value={newRoom.name}
                onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                placeholder="Ex: Salle A, Labo 1"
                className="mt-1"
                disabled={isAdding}
              />
            </div>
             <div>
              <Label>Bâtiment</Label>
              <Input
                value={newRoom.building}
                onChange={(e) => setNewRoom({...newRoom, building: e.target.value})}
                placeholder="Ex: A, B"
                className="mt-1"
                disabled={isAdding}
              />
            </div>
            <div>
              <Label>Capacité</Label>
              <Input
                type="number"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({...newRoom, capacity: parseInt(e.target.value) || 0})}
                min="10"
                max="50"
                className="mt-1"
                disabled={isAdding}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleAddRoom}
            disabled={!newRoom.name || !newRoom.capacity || isAdding}
            className="w-full"
          >
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAdding ? 'Ajout en cours...' : 'Ajouter la salle'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Salles configurées ({data.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((room) => (
              <Card key={room.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{room.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Capacité: {room.capacity} places
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      Bât. {room.building}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

      {data.length === 0 && (
        <Card className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <MapPin size={48} className="mx-auto mb-4 text-muted" />
            <p>Aucune salle configurée</p>
            <p className="text-sm">Commencez par ajouter des salles une par une</p>
          </div>
        </Card>
      )}

      {data.length > 0 && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="text-lg font-semibold text-primary mb-3">Statistiques salles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-primary/90">
            <div>
              <p className="font-medium">Total salles</p>
              <p className="text-2xl font-bold">{data.length}</p>
            </div>
            <div>
              <p className="font-medium">Capacité totale</p>
              <p className="text-2xl font-bold">
                {data.reduce((sum, room) => sum + room.capacity, 0)}
              </p>
            </div>
            <div>
              <p className="font-medium">Bâtiments</p>
              <p className="text-2xl font-bold">
                {new Set(data.map(room => room.building)).size}
              </p>
            </div>
            <div>
              <p className="font-medium">Capacité moyenne</p>
              <p className="text-2xl font-bold">
                {data.length > 0 ? Math.round(data.reduce((sum, room) => sum + room.capacity, 0) / data.length) : 0}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClassroomsForm;
