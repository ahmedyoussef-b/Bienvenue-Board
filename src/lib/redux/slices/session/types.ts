// src/lib/redux/slices/session/types.ts
import { SafeUser } from '@/types';

export type BadgeType = 'participation' | 'correct_answer' | 'helpful' | 'creative' | 'leader' | 'consistent';
export type ReactionType = 'thumbs_up' | 'thumbs_down' | 'heart' | 'laugh' | 'understood' | 'confused';
export type SessionType = 'class' | 'meeting';
export type ParticipantRole = 'admin' | 'teacher' | 'student';
export type RewardActionType = 'manual' | 'quiz_correct' | 'participation' | 'poll_vote';

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface SessionParticipant {
  id: string;
  name: string;
  email: string;
  role: ParticipantRole;
  img?: string | null;
  isOnline: boolean;
  isInSession: boolean;
  hasRaisedHand?: boolean;
  raisedHandAt?: string;
  points: number;
  badges: Badge[];
  isMuted?: boolean;
  breakoutRoomId?: string | null;
}

export interface ClassRoom {
  id: number;
  name: string;
  students: SessionParticipant[];
  abbreviation: string | null;
  capacity: number;
  building: string | null;
}

export interface Reaction {
  id: string;
  studentId: string;
  studentName: string;
  type: ReactionType;
  timestamp: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

export interface QuizAnswer {
  studentId: string;
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  answeredAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  isActive: boolean;
  startTime: string;
  endTime?: string;
  answers: QuizAnswer[];
  timeRemaining: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  createdAt: string;
  endedAt?: string;
  totalVotes: number;
}

export interface RewardAction {
  id: string;
  studentId: string;
  studentName: string;
  type: RewardActionType;
  points: number;
  badge?: Badge;
  reason: string;
  timestamp: string;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  participantIds: string[];
}

export interface TimerState {
  duration: number;
  remaining: number;
  isActive: boolean;
}

export interface BreakoutTimer {
  duration: number;
  remaining: number;
}

export interface ChatroomMessage {
  id: string;
  content: string;
  authorId: string;
  chatroomSessionId: string;
  createdAt: string;
  author: Partial<SafeUser>;
}

export interface ActiveSession {
  title: any;
  id: string;
  hostId: string;
  sessionType: SessionType;
  classId: string;
  className: string;
  participants: SessionParticipant[];
  startTime: string;
  raisedHands: string[];
  reactions: Reaction[];
  polls: Poll[];
  activePoll?: Poll;
  quizzes: Quiz[];
  activeQuiz?: Quiz;
  rewardActions: RewardAction[];
  classTimer: TimerState | null;
  spotlightedParticipantId?: string | null;
  breakoutRooms: BreakoutRoom[] | null;
  breakoutTimer: BreakoutTimer | null;
  messages: ChatroomMessage[];
}

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  quizzes: Omit<Quiz, 'id' | 'startTime' | 'isActive' | 'currentQuestionIndex' | 'answers' | 'timeRemaining'>[];
  polls: Omit<Poll, 'id' | 'createdAt' | 'isActive' | 'totalVotes' | 'options'> & {
    question: any; options: string[] 
}[];
}

export type ChatMessage = { 
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
  userRole: 'admin' | 'teacher';
};

export interface SessionState {
  classes: ClassRoom[];
  selectedClass: ClassRoom | null;
  selectedStudents: string[];
  meetingCandidates: SessionParticipant[];
  selectedTeachers: string[];
  activeSession: ActiveSession | null;
  loading: boolean;
  chatMessages: ChatMessage[];
}

export const initialState: SessionState = {
  classes: [],
  selectedClass: null,
  selectedStudents: [],
  meetingCandidates: [],
  selectedTeachers: [],
  activeSession: null,
  loading: false,
  chatMessages: [],
};
