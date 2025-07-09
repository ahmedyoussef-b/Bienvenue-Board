import { PayloadAction } from '@reduxjs/toolkit';
import { arrayMove } from '@dnd-kit/sortable';
import { SessionState, SessionParticipant, ClassRoom } from '../types';

export const participantReducers = {
  setSelectedClass: (state: SessionState, action: PayloadAction<ClassRoom | null>) => {
    state.selectedClass = action.payload;
    state.selectedStudents = [];
  },
  toggleStudentSelection: (state: SessionState, action: PayloadAction<string>) => {
    const studentId = action.payload;
    state.selectedStudents = state.selectedStudents.includes(studentId)
      ? state.selectedStudents.filter(id => id !== studentId)
      : [...state.selectedStudents, studentId];
  },
  toggleTeacherSelection: (state: SessionState, action: PayloadAction<string>) => {
    const teacherId = action.payload;
    state.selectedTeachers = state.selectedTeachers.includes(teacherId)
      ? state.selectedTeachers.filter(id => id !== teacherId)
      : [...state.selectedTeachers, teacherId];
  },
  moveParticipant: (state: SessionState, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
    if (state.activeSession) {
      const { fromIndex, toIndex } = action.payload;
      state.activeSession.participants = arrayMove(
        state.activeSession.participants, 
        fromIndex, 
        toIndex
      );
    }
  },
  removeStudentFromSession: (state: SessionState, action: PayloadAction<string>) => {
    if (state.activeSession) {
      state.activeSession.participants = state.activeSession.participants.filter(
        p => p.id !== action.payload
      );
      state.activeSession.raisedHands = state.activeSession.raisedHands.filter(
        id => id !== action.payload
      );
    }
  },
  addStudentToSession: (state: SessionState, action: PayloadAction<SessionParticipant>) => {
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
  updateStudentPresence: (state: SessionState, action: PayloadAction<{ studentId: string; isOnline: boolean }>) => {
    const { studentId, isOnline } = action.payload;
    state.classes.forEach(c => {
      const student = c.students.find(s => s.id === studentId);
      if (student) student.isOnline = isOnline;
    });
    
    if (state.activeSession) {
      const participant = state.activeSession.participants.find(p => p.id === studentId);
      if (participant) participant.isOnline = isOnline;
    }
  },
};