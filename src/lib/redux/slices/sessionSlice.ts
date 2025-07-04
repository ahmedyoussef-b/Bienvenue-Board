
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { arrayMove } from '@dnd-kit/sortable';
import type { SafeUser } from '@/types';

// Centralized type definitions
export interface Badge {
  id: string;
  type: 'participation' | 'correct_answer' | 'helpful' | 'creative' | 'leader' | 'consistent';
  name: string;
  description: string;
  icon: string;
  earnedAt: string; 
}

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
  type: 'thumbs_up' | 'thumbs_down' | 'heart' | 'laugh' | 'understood' | 'confused';
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
  type: 'manual' | 'quiz_correct' | 'participation' | 'poll_vote';
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

export interface ActiveSession {
  id: string;
  hostId: string;
  sessionType: 'class' | 'meeting';
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
  classTimer: {
    duration: number;
    remaining: number;
    isActive: boolean;
  } | null;
  spotlightedParticipantId?: string | null;
  breakoutRooms: BreakoutRoom[] | null;
  breakoutTimer: {
      duration: number;
      remaining: number;
  } | null;
  messages: ChatroomMessage[];
}

export interface ChatroomMessage {
  id: string;
  content: string;
  authorId: string;
  chatroomSessionId: string;
  createdAt: string;
  author: Partial<SafeUser>;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  quizzes: Omit<Quiz, 'id' | 'startTime' | 'isActive' | 'currentQuestionIndex' | 'answers' | 'timeRemaining'>[];
  polls: Omit<Poll, 'id' | 'createdAt' | 'isActive' | 'totalVotes' | 'options'> & { options: string[] }[];
}

const SESSION_TEMPLATES: SessionTemplate[] = [
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
    polls: [],
  }
];

interface SessionState {
  classes: ClassRoom[];
  selectedClass: ClassRoom | null;
  selectedStudents: string[];
  meetingCandidates: SessionParticipant[];
  selectedTeachers: string[];
  activeSession: ActiveSession | null;
  loading: boolean;
  chatMessages: ChatMessage[];
}

const initialState: SessionState = {
  classes: [],
  selectedClass: null,
  selectedStudents: [],
  meetingCandidates: [],
  selectedTeachers: [],
  activeSession: null,
  loading: false,
  chatMessages: [],
};

// --- ASYNC THUNKS ---

export const fetchChatroomClasses = createAsyncThunk<ClassRoom[], void, { rejectValue: string }>(
  'session/fetchChatroomClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/chatroom/classes');
      if (!response.ok) throw new Error('Failed to fetch classes');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchMeetingParticipants = createAsyncThunk<SessionParticipant[], void, { rejectValue: string }>(
    'session/fetchMeetingParticipants',
    async (_, { rejectWithValue }) => {
      try {
        const response = await fetch('/api/chatroom/teachers');
        if (!response.ok) throw new Error('Failed to fetch teachers');
        return await response.json();
      } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
      }
    }
);

export const startSession = createAsyncThunk<ActiveSession, { classId: string; className: string; participantIds: string[], templateId?: string }, { rejectValue: string, state: { session: SessionState, auth: { user: SafeUser | null } } }>(
  'session/startSession',
  async ({ classId, className, participantIds, templateId }, { rejectWithValue, getState }) => {
    const state = getState();
    const host = state.auth.user;
    const selectedClass = state.session.classes.find(c => c.id.toString() === classId);

    if (!host || !selectedClass) return rejectWithValue('Host or class data not found');

    const participants = selectedClass.students
      .filter(s => participantIds.includes(s.id))
      .map(s => ({ ...s, isInSession: true, hasRaisedHand: false, points: s.points || 0, badges: s.badges || [], isMuted: false, breakoutRoomId: null }));
    
    // Add host to participants
    participants.unshift({ id: host.id, name: host.name || host.email, email: host.email, role: 'teacher', img: host.img, isOnline: true, isInSession: true, hasRaisedHand: false, points: 0, badges: [], isMuted: false, breakoutRoomId: null });

    let templatePolls: Poll[] = [];
    let templateQuizzes: Quiz[] = [];
    const selectedTemplate = templateId ? SESSION_TEMPLATES.find(t => t.id === templateId) : null;
    if (selectedTemplate) {
      templatePolls = selectedTemplate.polls.map(p => ({
        id: `poll_${Date.now()}_${Math.random()}`, question: p.question, options: p.options.map((text, i) => ({ id: `opt_${i}`, text, votes: [] })), isActive: false, createdAt: new Date().toISOString(), totalVotes: 0
      }));
      templateQuizzes = selectedTemplate.quizzes.map(q => ({
        id: `quiz_${Date.now()}_${Math.random()}`, title: q.title, questions: q.questions.map((ques, i) => ({ ...ques, id: `q_${i}` })), currentQuestionIndex: 0, isActive: false, startTime: new Date().toISOString(), answers: [], timeRemaining: q.questions[0]?.timeLimit || 30
      }));
    }
    
    const initialSessionPayload: Partial<ActiveSession> = {
      sessionType: 'class',
      classId,
      className,
      participants,
      hostId: host.id,
      title: className,
      polls: templatePolls,
      quizzes: templateQuizzes,
    };

    try {
      const response = await fetch('/api/chatroom/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialSessionPayload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to start session on server');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchSessionState = createAsyncThunk('session/fetchState', async (sessionId: string, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/chatroom/sessions/${sessionId}`);
    if (!response.ok) throw new Error('Failed to fetch session state');
    return await response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export const sendMessage = createAsyncThunk('session/sendMessage', async ({ sessionId, content }: { sessionId: string; content: string }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/chatroom/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return await response.json();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export const endSession = createAsyncThunk('session/endSession', async (sessionId: string, { rejectWithValue }) => {
    try {
        const response = await fetch(`/api/chatroom/sessions/${sessionId}/end`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to end session');
        return await response.json();
    } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
});


const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSelectedClass: (state, action: PayloadAction<ClassRoom | null>) => {
      state.selectedClass = action.payload;
      state.selectedStudents = [];
    },
    toggleStudentSelection: (state, action: PayloadAction<string>) => {
      const studentId = action.payload;
      if (state.selectedStudents.includes(studentId)) {
        state.selectedStudents = state.selectedStudents.filter(id => id !== studentId);
      } else {
        state.selectedStudents.push(studentId);
      }
    },
    toggleTeacherSelection: (state, action: PayloadAction<string>) => {
        const teacherId = action.payload;
        if (state.selectedTeachers.includes(teacherId)) {
            state.selectedTeachers = state.selectedTeachers.filter(id => id !== teacherId);
        } else {
            state.selectedTeachers.push(teacherId);
        }
    },
    moveParticipant: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
        if (state.activeSession) {
            const { fromIndex, toIndex } = action.payload;
            state.activeSession.participants = arrayMove(state.activeSession.participants, fromIndex, toIndex);
        }
    },
    removeStudentFromSession: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        state.activeSession.participants = state.activeSession.participants.filter(
          p => p.id !== action.payload
        );
        state.activeSession.raisedHands = state.activeSession.raisedHands.filter(
          id => id !== action.payload
        );
      }
    },
    addStudentToSession: (state, action: PayloadAction<SessionParticipant>) => {
      if (state.activeSession) {
        state.activeSession.participants.push({ 
          ...action.payload, 
          isInSession: true, 
          hasRaisedHand: false,
          points: action.payload.points || 0,
          badges: action.payload.badges || [],
          isMuted: false,
          breakoutRoomId: null,
        });
      }
    },
    raiseHand: (state, action: PayloadAction<string>) => {
      const studentId = action.payload;
      if (state.activeSession) {
        if (!state.activeSession.raisedHands.includes(studentId)) {
          state.activeSession.raisedHands.push(studentId);
        }
        const participant = state.activeSession.participants.find(p => p.id === studentId);
        if (participant) {
          participant.hasRaisedHand = true;
          participant.raisedHandAt = new Date().toISOString();
        }
      }
    },
    lowerHand: (state, action: PayloadAction<string>) => {
      const studentId = action.payload;
      if (state.activeSession) {
        state.activeSession.raisedHands = state.activeSession.raisedHands.filter(id => id !== studentId);
        const participant = state.activeSession.participants.find(p => p.id === studentId);
        if (participant) {
          participant.hasRaisedHand = false;
          participant.raisedHandAt = undefined;
        }
      }
    },
    clearAllRaisedHands: (state) => {
      if (state.activeSession) {
        state.activeSession.raisedHands = [];
        state.activeSession.participants.forEach(p => {
          p.hasRaisedHand = false;
          p.raisedHandAt = undefined;
        });
      }
    },
    sendReaction: (state, action: PayloadAction<{ studentId: string; studentName: string; type: Reaction['type'] }>) => {
      if (state.activeSession) {
        state.activeSession.reactions.unshift({ ...action.payload, id: `reaction_${Date.now()}`, timestamp: new Date().toISOString() });
        if (state.activeSession.reactions.length > 50) state.activeSession.reactions.pop();
      }
    },
    clearReactions: (state) => {
      if (state.activeSession) state.activeSession.reactions = [];
    },
    createPoll: (state, action: PayloadAction<{ question: string; options: string[] }>) => {
      if (state.activeSession) {
        const poll: Poll = {
          id: `poll_${Date.now()}`, question: action.payload.question, options: action.payload.options.map((text, index) => ({ id: `option_${index}`, text, votes: [] })), isActive: true, createdAt: new Date().toISOString(), totalVotes: 0
        };
        state.activeSession.polls.push(poll);
        state.activeSession.activePoll = poll;
      }
    },
    votePoll: (state, action: PayloadAction<{ pollId: string; optionId: string; studentId: string }>) => {
        if (!state.activeSession) return;
        const poll = state.activeSession.polls.find(p => p.id === action.payload.pollId);
        if (!poll || !poll.isActive) return;
        const hasVoted = poll.options.some(opt => opt.votes.includes(action.payload.studentId));
        poll.options.forEach(option => { option.votes = option.votes.filter(id => id !== action.payload.studentId); });
        const option = poll.options.find(o => o.id === action.payload.optionId);
        if (option) option.votes.push(action.payload.studentId);
        if (!hasVoted) {
            const student = state.activeSession.participants.find(p => p.id === action.payload.studentId);
            if (student && state.activeSession.sessionType === 'class') {
                student.points = (student.points || 0) + 2;
                state.activeSession.rewardActions.unshift({ id: `reward_poll_${Date.now()}`, studentId: action.payload.studentId, studentName: student.name, type: 'poll_vote', points: 2, reason: `A voté au sondage: "${poll.question.substring(0, 20)}..."`, timestamp: new Date().toISOString() });
            }
        }
        poll.totalVotes = poll.options.reduce((total, opt) => total + opt.votes.length, 0);
        if (state.activeSession.activePoll?.id === poll.id) state.activeSession.activePoll = { ...poll };
    },
    endPoll: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        const poll = state.activeSession.polls.find(p => p.id === action.payload);
        if (poll) {
          poll.isActive = false;
          poll.endedAt = new Date().toISOString();
          if (state.activeSession.activePoll?.id === poll.id) state.activeSession.activePoll = undefined;
        }
      }
    },
    updateStudentPresence: (state, action: PayloadAction<{ studentId: string; isOnline: boolean }>) => {
      state.classes.forEach(c => c.students.find(s => s.id === action.payload.studentId && (s.isOnline = action.payload.isOnline)));
      if (state.activeSession?.participants) state.activeSession.participants.find(p => p.id === action.payload.studentId && (p.isOnline = action.payload.isOnline));
    },
    createQuiz: (state, action: PayloadAction<{ title: string; questions: Omit<QuizQuestion, 'id'>[] }>) => {
      if (state.activeSession) {
        const quiz: Quiz = {
          id: `quiz_${Date.now()}`, title: action.payload.title, questions: action.payload.questions.map((q, i) => ({ ...q, id: `q_${i}` })), currentQuestionIndex: 0, isActive: true, startTime: new Date().toISOString(), answers: [], timeRemaining: action.payload.questions[0]?.timeLimit || 30
        };
        state.activeSession.quizzes.push(quiz);
        state.activeSession.activeQuiz = quiz;
      }
    },
    answerQuiz: (state, action: PayloadAction<{ quizId: string; questionId: string; selectedOption: number; studentId: string }>) => {
        if (!state.activeSession) return;
        const quiz = state.activeSession.quizzes.find(q => q.id === action.payload.quizId);
        if (!quiz || !quiz.isActive) return;
        const question = quiz.questions.find(q => q.id === action.payload.questionId);
        if (!question || quiz.answers.some(a => a.studentId === action.payload.studentId && a.questionId === action.payload.questionId)) return;
        const isCorrect = action.payload.selectedOption === question.correctAnswer;
        quiz.answers.push({ ...action.payload, isCorrect, answeredAt: new Date().toISOString() });
        const student = state.activeSession.participants.find(p => p.id === action.payload.studentId);
        if (student && state.activeSession.sessionType === 'class') {
            const points = isCorrect ? 10 : 1;
            student.points = (student.points || 0) + points;
            state.activeSession.rewardActions.unshift({ id: `reward_quiz_${Date.now()}`, studentId: action.payload.studentId, studentName: student.name, type: isCorrect ? 'quiz_correct' : 'participation', points, reason: `${isCorrect ? 'Bonne réponse' : 'Participation'} au quiz: "${question.question.substring(0, 20)}..."`, timestamp: new Date().toISOString() });
        }
        if (state.activeSession.activeQuiz?.id === quiz.id) state.activeSession.activeQuiz = { ...quiz };
    },
    nextQuizQuestion: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        const quiz = state.activeSession.quizzes.find(q => q.id === action.payload);
        if (quiz && quiz.isActive) {
          if (quiz.currentQuestionIndex < quiz.questions.length - 1) {
            quiz.currentQuestionIndex++;
            quiz.timeRemaining = quiz.questions[quiz.currentQuestionIndex].timeLimit;
          } else {
            quiz.isActive = false;
            quiz.endTime = new Date().toISOString();
            if (state.activeSession.activeQuiz?.id === quiz.id) state.activeSession.activeQuiz = undefined;
          }
          if (state.activeSession.activeQuiz?.id === quiz.id) state.activeSession.activeQuiz = { ...quiz };
        }
      }
    },
    updateQuizTimer: (state, action: PayloadAction<{ quizId: string; timeRemaining: number }>) => {
      if (state.activeSession) {
        const quiz = state.activeSession.quizzes.find(q => q.id === action.payload.quizId);
        if (quiz && quiz.isActive) {
          quiz.timeRemaining = action.payload.timeRemaining;
          if (state.activeSession.activeQuiz?.id === quiz.id) state.activeSession.activeQuiz = { ...quiz };
        }
      }
    },
    endQuiz: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        const quiz = state.activeSession.quizzes.find(q => q.id === action.payload);
        if (quiz) {
          quiz.isActive = false;
          quiz.endTime = new Date().toISOString();
          if (state.activeSession.activeQuiz?.id === quiz.id) state.activeSession.activeQuiz = undefined;
        }
      }
    },
    awardReward: (state, action: PayloadAction<{ studentId: string; points: number; badge?: Omit<Badge, 'id' | 'earnedAt'>; reason: string }>) => {
      if (state.activeSession) {
        const student = state.activeSession.participants.find(p => p.id === action.payload.studentId);
        if (student) {
          student.points += action.payload.points;
          let badge: Badge | undefined;
          if (action.payload.badge) {
            badge = { ...action.payload.badge, id: `badge_${Date.now()}`, earnedAt: new Date().toISOString() };
            if (!student.badges) student.badges = [];
            student.badges.push(badge);
          }
          state.activeSession.rewardActions.unshift({ id: `reward_${Date.now()}`, studentId: action.payload.studentId, studentName: student.name, type: 'manual', points: action.payload.points, badge, reason: action.payload.reason, timestamp: new Date().toISOString() });
        }
      }
    },
    awardParticipationPoints: (state, action: PayloadAction<string>) => {
      if (state.activeSession) {
        const student = state.activeSession.participants.find(p => p.id === action.payload);
        if (student) {
          student.points += 5;
          state.activeSession.rewardActions.push({ id: `reward_${Date.now()}`, studentId: action.payload, studentName: student.name, type: 'participation', points: 5, reason: 'Participation active', timestamp: new Date().toISOString() });
        }
      }
    },
    clearChatMessages: (state) => { state.chatMessages = []; },
    setTimer: (state, action: PayloadAction<number>) => {
      if (state.activeSession) state.activeSession.classTimer = { duration: action.payload, remaining: action.payload, isActive: false };
    },
    toggleTimer: (state) => {
      if (state.activeSession?.classTimer) state.activeSession.classTimer.isActive = !state.activeSession.classTimer.isActive;
    },
    resetTimer: (state) => {
      if (state.activeSession?.classTimer) {
        state.activeSession.classTimer.remaining = state.activeSession.classTimer.duration;
        state.activeSession.classTimer.isActive = false;
      }
    },
    stopTimer: (state) => {
      if (state.activeSession) state.activeSession.classTimer = null;
    },
    tickTimer: (state) => {
      if (state.activeSession?.classTimer?.isActive && state.activeSession.classTimer.remaining > 0) {
        state.activeSession.classTimer.remaining--;
      } else if (state.activeSession?.classTimer) {
        state.activeSession.classTimer.isActive = false;
      }
    },
    toggleMute: (state, action: PayloadAction<string>) => {
      const participant = state.activeSession?.participants.find(p => p.id === action.payload);
      if (participant) participant.isMuted = !participant.isMuted;
    },
    muteAllStudents: (state) => { if (state.activeSession) state.activeSession.participants.forEach(p => p.role === 'student' && (p.isMuted = true)); },
    unmuteAllStudents: (state) => { if (state.activeSession) state.activeSession.participants.forEach(p => p.role === 'student' && (p.isMuted = false)); },
    toggleSpotlight: (state, action: PayloadAction<string>) => {
      if (state.activeSession) state.activeSession.spotlightedParticipantId = state.activeSession.spotlightedParticipantId === action.payload ? null : action.payload;
    },
    createBreakoutRooms: (state, action: PayloadAction<{ numberOfRooms: number, durationMinutes: number }>) => {
        if (!state.activeSession) return;
        const students = state.activeSession.participants.filter(p => p.role === 'student');
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        const rooms: BreakoutRoom[] = Array.from({ length: action.payload.numberOfRooms }, (_, i) => ({ id: `br_${Date.now()}_${i}`, name: `Salle ${i + 1}`, participantIds: [] }));
        shuffled.forEach((s, i) => {
          const roomIndex = i % action.payload.numberOfRooms;
          rooms[roomIndex].participantIds.push(s.id);
          const p = state.activeSession?.participants.find(p => p.id === s.id);
          if (p) p.breakoutRoomId = rooms[roomIndex].id;
        });
        state.activeSession.breakoutRooms = rooms;
        state.activeSession.breakoutTimer = { duration: action.payload.durationMinutes * 60, remaining: action.payload.durationMinutes * 60 };
    },
    endBreakoutRooms: (state) => {
        if (state.activeSession) {
          state.activeSession.breakoutRooms = null;
          state.activeSession.breakoutTimer = null;
          state.activeSession.participants.forEach(p => p.breakoutRoomId = null);
        }
    },
    breakoutTimerTick: (state) => {
        if (state.activeSession?.breakoutTimer && state.activeSession.breakoutTimer.remaining > 0) {
          state.activeSession.breakoutTimer.remaining--;
        } else if (state.activeSession?.breakoutTimer) {
          state.activeSession.breakoutRooms = null;
          state.activeSession.breakoutTimer = null;
          state.activeSession.participants.forEach(p => p.breakoutRoomId = null);
        }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatroomClasses.pending, (state) => { state.loading = true; })
      .addCase(fetchChatroomClasses.fulfilled, (state, action: PayloadAction<ClassRoom[]>) => {
        state.classes = action.payload;
        state.loading = false;
      })
      .addCase(fetchChatroomClasses.rejected, (state) => { state.loading = false; })
      .addCase(fetchMeetingParticipants.pending, (state) => { state.loading = true; })
      .addCase(fetchMeetingParticipants.fulfilled, (state, action: PayloadAction<SessionParticipant[]>) => {
        state.meetingCandidates = action.payload;
        state.loading = false;
      })
      .addCase(fetchMeetingParticipants.rejected, (state) => { state.loading = false; })
      .addCase(startSession.pending, (state) => { state.loading = true; })
      .addCase(startSession.fulfilled, (state, action: PayloadAction<ActiveSession>) => {
        state.activeSession = action.payload;
        state.loading = false;
      })
      .addCase(startSession.rejected, (state) => { state.loading = false; })
      .addCase(fetchSessionState.fulfilled, (state, action) => {
        state.activeSession = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        if (state.activeSession) {
          state.activeSession.messages.push(action.payload);
        }
      })
      .addCase(endSession.fulfilled, (state) => {
          state.activeSession = null;
          state.selectedStudents = [];
          state.selectedTeachers = [];
      });
  },
});

export const {
  setSelectedClass, toggleStudentSelection, toggleTeacherSelection, moveParticipant, removeStudentFromSession, addStudentToSession, raiseHand, lowerHand, clearAllRaisedHands, sendReaction, clearReactions, createPoll, votePoll, endPoll, updateStudentPresence, createQuiz, answerQuiz, nextQuizQuestion, updateQuizTimer, endQuiz, awardReward, awardParticipationPoints, clearChatMessages, setTimer, toggleTimer, resetTimer, stopTimer, tickTimer, toggleMute, muteAllStudents, unmuteAllStudents, toggleSpotlight, createBreakoutRooms, endBreakoutRooms, breakoutTimerTick
} = sessionSlice.actions;

export default sessionSlice.reducer;
