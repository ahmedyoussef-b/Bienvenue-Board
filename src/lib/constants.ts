// src/lib/constants.ts
import { Role } from "@/types/index";
import type { Day } from '@/types';
import type { SessionTemplate, Quiz, Poll } from '@/lib/redux/slices/session/types';

export const ITEM_PER_PAGE = 10;
export const SESSION_COOKIE_NAME = 'appSessionToken';

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
export const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const attendanceMap: { [key: string]: { present: number; absent: number } } = {
  Lun: { present: 0, absent: 0 },
  Mar: { present: 0, absent: 0 },
  Mer: { present: 0, absent: 0 },
  Jeu: { present: 0, absent: 0 },
  Ven: { present: 0, absent: 0 },
  Sam: { present: 0, absent: 0 },
};

export const subjectColors = ['bg-primary/20', 'bg-secondary/20', 'bg-accent/20', 'bg-chart-1/20', 'bg-chart-2/20', 'bg-chart-3/20', 'bg-chart-4/20', 'bg-chart-5/20'];

export const menuItems: Array<{
  title: string;
  items: Array<{
    icon: string;
    label: string;
    href: string;
    visible: Role[]; 
  }>;
}> = [
  {
    title: "MENU",
    items: [
      { icon: "/home.png", label: "Accueil", href: "/", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: "/calendar.png", label: "Planificateur", href: "/shuddle", visible: [Role.ADMIN], },
      { icon: "/exam.png", label: "Rapports", href: "/admin/reports", visible: [Role.ADMIN], },
      { icon: "/teacher.png", label: "Enseignants", href: "/list/teachers", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: "/student.png", label: "Étudiants", href: "/list/students", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: "/parent.png", label: "Parents", href: "/list/parents", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: "/subject.png", label: "Matières", href: "/list/subjects", visible: [Role.ADMIN], },
      { icon: "/class.png", label: "Classes", href: "/list/classes", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: "/lesson.png", label: "Cours", href: "/list/lessons", visible: [Role.ADMIN, Role.TEACHER], },
      { icon: "/exam.png", label: "Examens", href: "/list/exams", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: "/assignment.png", label: "Devoirs", href: "/list/assignments", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: "/result.png", label: "Résultats", href: "/list/results", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: "/attendance.png", label: "Présence", href: "/list/attendance", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: "/calendar.png", label: "Événements", href: "/list/events", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: "/message.png", label: "Chatroom", href: "/list/chatroom", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT] },
      { icon: "/mail.png", label: "Messages", href: "/list/messages", visible: [Role.ADMIN, Role.TEACHER, Role.PARENT] },
      { icon: "/announcement.png", label: "Annonces", href: "/list/announcements", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
    ],
  },
  {
    title: "AUTRE",
    items: [
      { icon: "/profile.png", label: "Profil", href: "/profile", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
      { icon: "/setting.png", label: "Paramètres", href: "/settings", visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT], },
    ],
  },
];
type TemplatePoll = Omit<Poll, 'id' | 'isActive' | 'createdAt' | 'totalVotes'> & {
  options: string[];
};
export const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'template_math_7',
    name: 'Révision Maths 7ème',
    description: 'Un quiz rapide sur les fractions et un sondage sur la géométrie.',
    quizzes: [
      { 
        title: 'Quiz sur les Fractions',
        questions: [
          {
            id: 'q1',
            question: 'Que vaut 1/2 + 1/4 ?',
            options: ['3/4', '2/6', '1/8', '1/2'],
            correctAnswer: 0,
            timeLimit: 30,
          },
          {
            id: 'q2',
            question: 'Simplifiez 10/20.',
            options: ['1/2', '2/4', '5/10', 'Toutes ces réponses'],
            correctAnswer: 3,
            timeLimit: 20,
          }
        ]
      }
    ],
    polls: [
      {
        question: 'Quelle est votre figure géométrique préférée ?',
        options: ['Cercle', 'Carré', 'Triangle', 'Hexagone'],
      }
    ]
  },
  {
    id: 'template_hist_8',
    name: 'Contrôle Histoire 8ème',
    description: 'Un sondage sur la révolution et un quiz sur les dates clés.',
    quizzes: [
      {
        title: 'Dates Clés',
        questions: [
          {
            id: 'q1',
            question: 'Année de la chute de Rome ?',
            options: ['476', '1453', '1789', '1914'],
            correctAnswer: 0,
            timeLimit: 25,
          }
        ]
      }
    ],
    polls: [] as TemplatePoll[]  }
];
export const reactionLabels = {
  thumbs_up: 'J\'aime',
  thumbs_down: 'Je n\'aime pas',
  heart: 'J\'adore',
  laugh: 'Drôle',
  understood: 'Compris !',
  confused: 'Confus(e)',
};
