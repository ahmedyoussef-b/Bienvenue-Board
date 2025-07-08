import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState } from '../types';

export const handRaiseReducers = {
  raiseHand: (state: SessionState, action: PayloadAction<string>) => {
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
  lowerHand: (state: SessionState, action: PayloadAction<string>) => {
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
  clearAllRaisedHands: (state: SessionState) => {
    if (state.activeSession) {
      state.activeSession.raisedHands = [];
      state.activeSession.participants.forEach(p => {
        p.hasRaisedHand = false;
        p.raisedHandAt = undefined;
      });
    }
  },
};