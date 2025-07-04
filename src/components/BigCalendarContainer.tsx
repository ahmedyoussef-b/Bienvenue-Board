// src/components/BigCalendarContainer.tsx
"use client"
import React, { useState, useEffect } from 'react';
import BigCalendar from "./BigCalender";
import { adjustScheduleToCurrentWeek } from "@/lib/utils";
import type { Lesson, Subject, Class as PrismaClass } from "@/types";
import { Spinner } from '@/components/ui/spinner';

interface BigCalendarContainerProps {
  type: "teacherId" | "classId";
  id: string | number;
}

// Define the type for the lesson data we expect from our API
type ScheduleData = (Lesson & {
  subject: Pick<Subject, 'name'>;
  class: Pick<PrismaClass, 'name'>;
});


const BigCalendarContainer: React.FC<BigCalendarContainerProps> = ({ type, id }) => {
  const [scheduleData, setScheduleData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduleData = async () => {
      if (!type || !id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching schedule data for type: ${type}, id: ${id}`);
        
        const response = await fetch(`/api/lessons/schedule?${type}=${id}`);
        if (!response.ok) {
          throw new Error('Échec de la récupération des données de l\'emploi du temps');
        }
        const data: ScheduleData[] = await response.json();
        
        setScheduleData(data);
      } catch (err: any) {
        console.error("Error fetching schedule data:", err);
        setError(err.message || 'Une erreur est survenue.');
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [type, id]); // Re-fetch when type or id changes

  // Formate les données de l'emploi du temps en utilisant la fonction utilitaire
  const formattedSchedule = adjustScheduleToCurrentWeek(scheduleData);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Spinner size="lg" />
            <p className="ml-2">Chargement de l'emploi du temps...</p>
        </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center p-4">Erreur: {error}</div>;
  }
  
  if (formattedSchedule.length === 0) {
      return <div className="text-muted-foreground text-center p-4">Aucun cours trouvé dans l'emploi du temps.</div>
  }

  return (
    <div className="h-full">
      <BigCalendar data={formattedSchedule} />
    </div>
  );
};

export default BigCalendarContainer;
