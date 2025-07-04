
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Users, Calendar, Eye } from 'lucide-react';
import type { SessionReport } from '@/lib/redux/slices/reportSlice';

interface SessionReportCardProps {
  session: SessionReport;
}

export default function SessionReportCard({ session }: SessionReportCardProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(dateString));
  };

  const averageParticipationTime = session.participants.length > 0 
    ? session.participants.reduce((sum, p) => sum + p.duration, 0) / session.participants.length
    : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{session.className}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Par {session.teacherName}
            </p>
          </div>
          <Badge 
            variant={session.status === 'active' ? 'default' : 'secondary'}
            className={session.status === 'active' ? 'bg-green-100 text-green-800' : ''}
          >
            {session.status === 'active' ? 'Active' : 'Terminée'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <div>
              <p className="font-medium">Début</p>
              <p className="text-gray-600">{formatDateTime(session.startTime)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <p className="font-medium">Durée</p>
              <p className="text-gray-600">{formatDuration(session.duration)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div>
              <p className="font-medium">Participants</p>
              <p className="text-gray-600">{session.participants.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <p className="font-medium">Temps moyen</p>
              <p className="text-gray-600">{formatDuration(Math.round(averageParticipationTime))}</p>
            </div>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Voir les détails
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la session - {session.className}</DialogTitle>
              <DialogDescription>
                Session du {formatDateTime(session.startTime)}
                {session.endTime && ` - ${formatDateTime(session.endTime)}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-500">Durée totale</p>
                  <p className="text-lg font-semibold">{formatDuration(session.duration)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Participants</p>
                  <p className="text-lg font-semibold">{session.participants.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Temps moyen</p>
                  <p className="text-lg font-semibold">{formatDuration(Math.round(averageParticipationTime))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Statut</p>
                  <Badge 
                    variant={session.status === 'active' ? 'default' : 'secondary'}
                    className={session.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {session.status === 'active' ? 'Active' : 'Terminée'}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">Participants</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Arrivée</TableHead>
                      <TableHead>Départ</TableHead>
                      <TableHead>Temps de participation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {session.participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">{participant.name}</TableCell>
                        <TableCell>{participant.email}</TableCell>
                        <TableCell>{formatDateTime(participant.joinTime)}</TableCell>
                        <TableCell>
                          {participant.leaveTime ? formatDateTime(participant.leaveTime) : 'En cours'}
                        </TableCell>
                        <TableCell>{formatDuration(participant.duration)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
