// src/app/[locale]/(dashboard)/admin/chatroom/page.tsx
'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Clock, Video, TrendingUp, BarChart3, Presentation } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Mock data since we don't have a persistent session store yet
const mockData = {
  teachers: [
    { id: 't1', name: 'M. Dubois' },
    { id: 't2', name: 'Mme. Lefevre' },
    { id: 't3', name: 'M. Martin' },
    { id: 't4', name: 'Mme. Bernard' },
  ],
  sessions: [
    { id: 's1', teacherId: 't1', className: '7ème Base 1', duration: 3200, participants: 22, date: '2024-07-20T10:00:00Z', engagement: 85 },
    { id: 's2', teacherId: 't2', className: '8ème Base 3', duration: 3800, participants: 28, date: '2024-07-20T09:00:00Z', engagement: 92 },
    { id: 's3', teacherId: 't1', className: '7ème Base 2', duration: 3500, participants: 25, date: '2024-07-19T14:00:00Z', engagement: 78 },
    { id: 's4', teacherId: 't3', className: '9ème Base 1', duration: 3600, participants: 30, date: '2024-07-19T11:00:00Z', engagement: 95 },
    { id: 's5', teacherId: 't2', className: '8ème Base 4', duration: 3100, participants: 27, date: '2024-07-18T15:00:00Z', engagement: 88 },
    { id: 's6', teacherId: 't4', className: '7ème Base 5', duration: 4200, participants: 24, date: '2024-07-18T10:00:00Z', engagement: 81 },
    { id: 's7', teacherId: 't1', className: '7ème Base 1', duration: 3300, participants: 23, date: '2024-07-17T11:00:00Z', engagement: 90 },
  ],
};

const processData = () => {
  const totalSessions = mockData.sessions.length;
  const totalDuration = mockData.sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalParticipants = mockData.sessions.reduce((sum, s) => sum + s.participants, 0);
  const totalEngagement = mockData.sessions.reduce((sum, s) => sum + s.engagement, 0);

  const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
  const avgParticipants = totalSessions > 0 ? totalParticipants / totalSessions : 0;
  const avgEngagement = totalSessions > 0 ? totalEngagement / totalSessions : 0;

  const sessionsPerTeacher = mockData.teachers.map(teacher => ({
    name: teacher.name,
    sessions: mockData.sessions.filter(s => s.teacherId === teacher.id).length,
  }));
  
  return {
    totalSessions,
    avgDuration,
    avgParticipants,
    avgEngagement,
    sessionsPerTeacher
  };
};

export default function AdminChatroomDashboardPage() {
  const router = useRouter();
  const { 
      totalSessions, 
      avgDuration, 
      avgParticipants, 
      avgEngagement,
      sessionsPerTeacher
  } = processData();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };
  
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <Presentation className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Tableau de Bord Chatroom</h1>
            </div>
            <p className="text-muted-foreground">Statistiques agrégées sur l'utilisation des sessions interactives.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/fr/admin')}>
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Retour
            </Button>
            <Button asChild>
                <Link href="/fr/list/chatroom/chat/admin">
                    <Video className="mr-2 h-4 w-4"/>
                    Lancer une Réunion
                </Link>
            </Button>
          </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sessions totales</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalSessions}</div>
                <p className="text-xs text-muted-foreground">sur les 7 derniers jours</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Participants moyens</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{avgParticipants.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">par session</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Durée moyenne</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
                 <p className="text-xs text-muted-foreground">par session</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Engagement moyen</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{avgEngagement.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">mains levées, sondages, quiz</p>
            </CardContent>
        </Card>
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sessions par Professeur</CardTitle>
            <CardDescription>Nombre de sessions lancées par chaque professeur cette semaine.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionsPerTeacher}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                <Legend/>
                <Bar dataKey="sessions" name="Sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions Récentes</CardTitle>
            <CardDescription>Les 5 dernières sessions interactives.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classe</TableHead>
                  <TableHead>Professeur</TableHead>
                  <TableHead className="text-right">Participants</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.sessions.slice(0, 5).map(session => (
                    <TableRow key={session.id}>
                        <TableCell className="font-medium">{session.className}</TableCell>
                        <TableCell>{mockData.teachers.find(t=>t.id === session.teacherId)?.name}</TableCell>
                        <TableCell className="text-right">{session.participants}</TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}