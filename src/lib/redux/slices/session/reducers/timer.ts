import { PayloadAction } from '@reduxjs/toolkit';
import { SessionState } from '../types';

export const timerReducers = {
  setTimer: (state: SessionState, action: PayloadAction<number>) => {
    if (state.activeSession) {
      state.activeSession.classTimer = { 
        duration: action.payload, 
        remaining: action.payload, 
        isActive: false 
      };
    }
  },
  toggleTimer: (state: SessionState) => {
    if (state.activeSession?.classTimer) {
      state.activeSession.classTimer.isActive = !state.activeSession.classTimer.isActive;
    }
  },
  resetTimer: (state: SessionState) => {
    if (state.activeSession?.classTimer) {
      state.activeSession.classTimer.remaining = state.activeSession.classTimer.duration;
      state.activeSession.classTimer.isActive = false;
    }
  },
  stopTimer: (state: SessionState) => {
    if (state.activeSession) {
      state.activeSession.classTimer = null;
    }
  },
  tickTimer: (state: SessionState) => {
    if (state.activeSession?.classTimer?.isActive && state.activeSession.classTimer.remaining > 0) {
      state.activeSession.classTimer.remaining--;
    } else if (state.activeSession?.classTimer) {
      state.activeSession.classTimer.isActive = false;
    }
  },
};