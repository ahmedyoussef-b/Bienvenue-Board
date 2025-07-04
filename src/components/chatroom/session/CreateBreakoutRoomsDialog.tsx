// src/components/chatroom/session/CreateBreakoutRoomsDialog.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { createBreakoutRooms } from '@/lib/redux/slices/sessionSlice';
import { useToast } from "@/hooks/use-toast";

export default function CreateBreakoutRoomsDialog() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [numberOfRooms, setNumberOfRooms] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(10);
  
  const studentCount = useAppSelector(state => state.session.activeSession?.participants.filter(p => p.role === 'student').length || 0);
  const maxRooms = studentCount > 1 ? Math.floor(studentCount / 2) : 1;
  
  const handleCreate = () => {
    if (numberOfRooms > studentCount) {
        toast({
            variant: "destructive",
            title: "Trop de salles",
            description: "Le nombre de salles ne peut pas être supérieur au nombre d'élèves.",
        });
        return;
    }
    
    dispatch(createBreakoutRooms({ numberOfRooms, durationMinutes }));
    toast({
        title: "Salles de sous-commission créées",
        description: `${numberOfRooms} salles ont été créées pour une durée de ${durationMinutes} minutes.`
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Users className="w-4 h-4"/>
            Salles de sous-commission
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer des Salles de Sous-Commission</DialogTitle>
          <DialogDescription>
            Divisez les participants en petits groupes pour des discussions ciblées.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="num-rooms">Nombre de salles</Label>
            <Input
              id="num-rooms"
              type="number"
              value={numberOfRooms}
              onChange={(e) => setNumberOfRooms(Math.max(1, parseInt(e.target.value, 10)))}
              min="1"
              max={maxRooms}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{studentCount} élèves seront répartis dans {numberOfRooms} salle(s).</p>
          </div>
          
          <div>
            <Label htmlFor="duration">Durée (en minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              min="1"
              max="120"
              className="mt-1"
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!numberOfRooms || !durationMinutes}
          >
            Créer les salles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
