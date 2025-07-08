// src/lib/redux/slices/sessionSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { initialState, type ActiveSession } from './session/types';

// Thunks
import { 
  fetchChatroomClasses, 
  fetchMeetingParticipants, 
  startSession, 
  startMeeting, 
  fetchSessionState, 
  endSession,
  sendMessage 
} from './session/thunks';

// Reducers
import { participantReducers } from './session/reducers/participants';
import { handRaiseReducers } from './session/reducers/handRaise';
import { reactionReducers } from './session/reducers/reactions';
import { pollReducers } from './session/reducers/polls';
import { quizReducers } from './session/reducers/quizzes';
import { rewardReducers } from './session/reducers/rewards';
import { timerReducers } from './session/reducers/timer';
import { audioReducers } from './session/reducers/audio';
import { spotlightReducers } from './session/reducers/spotlight';
import { breakoutRoomReducers } from './session/reducers/breakoutRooms';
import { chatReducers } from './session/reducers/chat';

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    ...participantReducers,
    ...handRaiseReducers,
    ...reactionReducers,
    ...pollReducers,
    ...quizReducers,
    ...rewardReducers,
    ...timerReducers,
    ...audioReducers,
    ...spotlightReducers,
    ...breakoutRoomReducers,
    ...chatReducers,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Chatroom Classes
      .addCase(fetchChatroomClasses.pending, (state) => { state.loading = true; })
      .addCase(fetchChatroomClasses.fulfilled, (state, action) => {
        state.classes = action.payload;
        state.loading = false;
      })
      .addCase(fetchChatroomClasses.rejected, (state) => { state.loading = false; })
      
      // Fetch Meeting Participants
      .addCase(fetchMeetingParticipants.pending, (state) => { state.loading = true; })
      .addCase(fetchMeetingParticipants.fulfilled, (state, action) => {
        state.meetingCandidates = action.payload;
        state.loading = false;
      })
      .addCase(fetchMeetingParticipants.rejected, (state) => { state.loading = false; })
      
      // Start Session / Meeting
      .addCase(startSession.pending, (state) => { state.loading = true; })
      .addCase(startSession.fulfilled, (state, action) => {
        state.activeSession = action.payload as ActiveSession;
        state.loading = false;
      })
      .addCase(startSession.rejected, (state) => { state.loading = false; })
      .addCase(startMeeting.pending, (state) => { state.loading = true; })
      .addCase(startMeeting.fulfilled, (state, action) => {
        state.activeSession = action.payload as ActiveSession;
        state.loading = false;
      })
      .addCase(startMeeting.rejected, (state) => { state.loading = false; })
      
      // Fetch Session State
      .addCase(fetchSessionState.pending, (state) => { state.loading = true; })
      .addCase(fetchSessionState.fulfilled, (state, action) => {
        state.activeSession = action.payload as ActiveSession;
        state.loading = false;
      })
      .addCase(fetchSessionState.rejected, (state) => { state.loading = false; })
      
      // End Session
      .addCase(endSession.fulfilled, (state) => {
        state.activeSession = null;
        state.selectedClass = null;
        state.selectedStudents = [];
        state.selectedTeachers = [];
      })
      
      // Send Message (in-session)
      .addCase(sendMessage.fulfilled, (state, action) => {
        if (state.activeSession) {
            state.activeSession.messages.push(action.payload);
        }
      });
  },
});

export const {
  setSelectedClass,
  toggleStudentSelection,
  toggleTeacherSelection,
  moveParticipant,
  removeStudentFromSession,
  addStudentToSession,
  updateStudentPresence,
  raiseHand,
  lowerHand,
  clearAllRaisedHands,
  sendReaction,
  clearReactions,
  createPoll,
  votePoll,
  endPoll,
  createQuiz,
  answerQuiz,
  nextQuizQuestion,
  updateQuizTimer,
  endQuiz,
  awardReward,
  awardParticipationPoints,
  setTimer,
  toggleTimer,
  resetTimer,
  stopTimer,
  tickTimer,
  toggleMute,
  muteAllStudents,
  unmuteAllStudents,
  toggleSpotlight,
  createBreakoutRooms,
  endBreakoutRooms,
  breakoutTimerTick,
  sendGeneralMessage,
  clearChatMessages
} = sessionSlice.actions;

export default sessionSlice.reducer;
export * from './session/thunks';
export * from './session/types';
