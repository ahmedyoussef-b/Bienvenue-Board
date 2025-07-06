import { ClassWithGrade, Subject as PrismaSubject, TeacherWithDetails, Classroom, Grade, Lesson, TeacherConstraint } from '@/types';

export type Subject = PrismaSubject;

export interface WizardData {
  school: {
    name: string;
    startTime: string;
    endTime: string;
    sessionDuration: number;
    schoolDays: string[];
  };
  classes: ClassWithGrade[];
  subjects: Subject[];
  teachers: TeacherWithDetails[];
  rooms: Classroom[];
  grades: Grade[];
  lessonRequirements: LessonRequirement[];
  teacherConstraints: TeacherConstraint[];
  subjectRequirements: SubjectRequirement[];
  teacherAssignments: TeacherAssignment[];
}

export interface LessonRequirement {
  classId: number;
  subjectId: number;
  hours: number;
}

export interface SubjectRequirement {
  subjectId: number;
  requiredRoomId: number | null;
  timePreference: 'ANY' | 'AM' | 'PM';
}

export interface TeacherAssignment {
  teacherId: string;
  subjectId: number;
  classIds: number[];
}

export interface DayOption {
  id: string;
  label: string;
}

export interface SectionOption {
  value: string;
  label: string;
}

export interface LabSubjectKeyword {
  keyword: string;
  roomPrefix: string;
}
