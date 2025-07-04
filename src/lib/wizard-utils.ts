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
