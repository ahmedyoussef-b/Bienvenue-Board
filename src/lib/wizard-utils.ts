// src/lib/wizard-utils.ts

import type { Day } from '@/types';

export const dayLabels: Record<Day, string> = {
  MONDAY: 'Lundi',
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi',
  SUNDAY: 'Dimanche',
};

export const labSubjectKeywords: string[] = ['physique', 'informatique', 'sciences', 'technique'];

export const sectionOptions: string[] = ['A', 'B', 'C', 'D', 'E', 'F'];
export   const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const attendanceMap: { [key: string]: { present: number; absent: number } } =
  {
    Lun: { present: 0, absent: 0 },
    Mar: { present: 0, absent: 0 },
    Mer: { present: 0, absent: 0 },
    Jeu: { present: 0, absent: 0 },
    Ven: { present: 0, absent: 0 },
    Sam: { present: 0, absent: 0 },
  };