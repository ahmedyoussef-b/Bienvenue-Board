// src/types/index.ts

// Manually define enums needed on the client.
// These must be kept in sync with prisma/schema.prisma.
export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  VISITOR = 'VISITOR',
}

export enum UserSex {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum Day {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

// TYPE IMPORTS FROM PRISMA - these are stripped out at build time for the client
// This is the key to preventing server code from leaking to the client.
import type {
    User as PrismaUser,
    Admin as PrismaAdmin,
    Teacher as PrismaTeacher,
    Student as PrismaStudent,
    Parent as PrismaParent,
    Announcement as PrismaAnnouncement,
    Session as PrismaSession,
    RefreshToken as PrismaRefreshToken,
    Class as PrismaClass,
    Subject as PrismaSubject,
    Classroom as PrismaClassroom,
    Grade as PrismaGrade,
    Lesson as PrismaLesson,
    Exam as PrismaExam,
    Assignment as PrismaAssignment,
    Event as PrismaEvent
} from "@prisma/client";

// Re-export specific types if needed elsewhere, but it's better to import directly from @prisma/client on the server.
// However, to minimize breaking changes, we re-export the *types*.
export type {
    PrismaUser as User,
    PrismaAdmin as Admin,
    PrismaTeacher as Teacher,
    PrismaStudent as Student,
    PrismaParent as Parent,
    PrismaAnnouncement as Announcement,
    PrismaSession as Session,
    PrismaRefreshToken as RefreshToken,
    PrismaClass as Class,
    PrismaSubject as Subject,
    PrismaClassroom as Classroom,
    PrismaGrade as Grade,
    PrismaLesson as Lesson,
    PrismaExam as Exam,
    PrismaAssignment as Assignment,
    PrismaEvent as Event
};


// Types sécurisés (sans données sensibles)
export type SafeUser = Omit<PrismaUser, 'password'>;
export type SafeAdmin = PrismaAdmin & { user: SafeUser };
export type SafeTeacher = PrismaTeacher & { user: SafeUser };
export type SafeStudent = PrismaStudent & { user: SafeUser };
export type SafeParent = PrismaParent & { user: SafeUser };


// Types étendus avec relations
export type UserWithRelations = PrismaUser & {
    admin: PrismaAdmin | null;
    teacher: PrismaTeacher | null;
    student: PrismaStudent | null;
    parent: PrismaParent | null;
    sessions: PrismaSession[];
    refreshTokens: PrismaRefreshToken[];
};

export type TeacherWithDetails = PrismaTeacher & {
    user: PrismaUser | null;
    subjects: PrismaSubject[];
    classes: PrismaClass[];
    lessons?: PrismaLesson[];
    _count: {
        classes: number;
        subjects: number;
        lessons?: number;
    };
};

export type StudentWithDetails = PrismaStudent & {
  user: PrismaUser | null;
  class: (PrismaClass & {
    _count: {
      select: { lessons: true }
    };
  }) | null;
  parent: PrismaParent | null;
  grade: PrismaGrade | null;
};

export type LessonWithDetails = PrismaLesson & {
  subject: PrismaSubject;
  class: PrismaClass;
  teacher: PrismaTeacher & {
      user: PrismaUser | null;
  };
  exams: PrismaExam[];
  assignments: PrismaAssignment[];
};

export type EventWithClass = PrismaEvent & {
  class: { name: string } | null;
};

export type AnnouncementWithClass = PrismaAnnouncement & {
  class: { name: string } | null;
};

export type ClassWithGrade = PrismaClass & {
  grade: PrismaGrade;
};

// Types pour les payloads d'API et le wizard
export interface LessonRequirement {
  classId: number;
  subjectId: number;
  hours: number;
}

export interface TeacherConstraint {
  id: string;
  teacherId: string;
  day: Day;
  startTime: string;
  endTime: string;
  description: string;
}

export interface SubjectRequirement {
    subjectId: number;
    requiredRoomId: number | 'any';
    timePreference: 'ANY' | 'AM' | 'PM';
}

export interface TeacherAssignment {
  teacherId: string;
  subjectId: number;
  classIds: number[];
}

export interface SchoolData {
  name: string;
  startTime: string;
  endTime: string;
  schoolDays: string[];
  sessionDuration: number;
}

export interface WizardData {
  school: SchoolData;
  classes: ClassWithGrade[];
  subjects: PrismaSubject[];
  teachers: TeacherWithDetails[];
  rooms: PrismaClassroom[];
  grades: PrismaGrade[];
  lessonRequirements: LessonRequirement[];
  teacherConstraints?: TeacherConstraint[];
  subjectRequirements?: SubjectRequirement[];
  teacherAssignments?: TeacherAssignment[];
}

export type CreateSubjectPayload = {
  name: string;
  weeklyHours: number;
  coefficient?: number;
};

export type CreateClassPayload = {
  name: string;
  abbreviation?: string;
  capacity: number;
  gradeLevel: number;
};

export type CreateClassroomPayload = {
  name: string;
  abbreviation?: string;
  capacity: number;
  building?: string;
};

export type CreateTeacherPayload = {
  name: string;
  surname: string;
  email: string;
  username: string;
  phone?: string;
  address?: string;
  subjects?: string[];
  classes?: string[];
};

// Types pour l'authentification
export interface AuthResponse {
  user: SafeUser;
  session: PrismaSession;
  refreshToken: PrismaRefreshToken;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  role: Role;
  name?: string;
}

// Types pour les payloads JWT
export interface JwtPayload {
  userId: string;
  role: Role;
  email: string;
  name?: string;
  iat: number;
  exp: number;
}

// Chatroom Types
export interface SessionParticipant {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  img?: string | null;
  isOnline: boolean;
  isInSession: boolean;
  hasRaisedHand?: boolean;
  raisedHandAt?: string;
  points: number;
  badges: any[]; // Replace 'any' with a proper Badge type if you have one
}

export interface ClassRoom {
  id: number;
  name: string;
  students: SessionParticipant[];
}

export interface ActiveSession {
  id: string;
  sessionType: 'class' | 'meeting';
  classId: string;
  className: string;
  participants: SessionParticipant[];
  startTime: string;
  raisedHands: string[];
  reactions: any[]; // Replace 'any' with a proper Reaction type
  polls: any[]; // Replace 'any' with a proper Poll type
  activePoll?: any; // Replace 'any' with a proper Poll type
  quizzes: any[]; // Replace 'any' with a proper Quiz type
  activeQuiz?: any; // Replace 'any' with a proper Quiz type
  rewardActions: any[]; // Replace 'any' with a proper Reward type
  classTimer: {
    duration: number;
    remaining: number;
    isActive: boolean;
  } | null;
}
