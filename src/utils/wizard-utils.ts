import { dayLabels, labSubjectKeywords } from './wizard-constants';
import type { Subject, Classroom } from '@/types';

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  return `${hours}h${minutes}`;
};

export const calculateTotalHours = (requirements: LessonRequirement[]): number => {
  return requirements.reduce((total, req) => total + req.hours, 0);
};

export const isLabSubject = (subject: Subject): boolean => {
  const subjectNameLower = subject.name.toLowerCase();
  return labSubjectKeywords.some(keyword => subjectNameLower.includes(keyword));
};

export const filterRoomsForSubject = (rooms: Classroom[], subject: Subject): Classroom[] => {
  if (!isLabSubject(subject)) {
    return rooms.filter(room => !room.name.toLowerCase().includes('labo'));
  }

  const subjectNameLower = subject.name.toLowerCase();
  const keyword = labSubjectKeywords.find(k => subjectNameLower.includes(k));
  
  return rooms.filter(room => 
    room.name.toLowerCase().includes('labo') && 
    (keyword ? room.name.toLowerCase().includes(keyword) : true)
  );
};

export const validateSchoolConfig = (config: WizardData['school']): string[] => {
  const errors: string[] = [];
  
  if (!config.name) errors.push("Le nom de l'établissement est requis");
  if (!config.startTime) errors.push("L'heure de début est requise");
  if (!config.endTime) errors.push("L'heure de fin est requise");
  if (config.schoolDays.length === 0) errors.push("Au moins un jour de cours doit être sélectionné");
  
  return errors;
};

export const getDayLabel = (dayId: string): string => {
  return dayLabels[dayId] || dayId;
};

export const generateClassName = (gradeLevel: number, section: string): string => {
  return `Niveau ${gradeLevel} - ${section}`;
};

export const calculateClassStatistics = (classes: ClassWithGrade[]) => {
  const totalStudents = classes.reduce((sum, cls) => sum + cls.capacity, 0);
  const averageClassSize = classes.length > 0 
    ? Math.round(totalStudents / classes.length) 
    : 0;
  const uniqueGradeLevels = new Set(classes.map(cls => cls.grade?.level)).size;

  return {
    totalClasses: classes.length,
    totalStudents,
    uniqueGradeLevels,
    averageClassSize
  };
};