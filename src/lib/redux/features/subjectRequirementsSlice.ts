// src/lib/redux/features/subjectRequirementsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SubjectRequirement } from '@/types';
import { TimePreference } from '@/types';

const initialState: { items: SubjectRequirement[] } = {
  items: [],
};

const subjectRequirementsSlice = createSlice({
  name: 'subjectRequirements',
  initialState,
  reducers: {
    setSubjectRequirement: (state, action: PayloadAction<{ subjectId: number, requiredRoomId: number | null }>) => {
        const { subjectId, requiredRoomId } = action.payload;
        const existingIndex = state.items.findIndex(r => r.subjectId === subjectId);
        if (existingIndex > -1) {
            state.items[existingIndex].requiredRoomId = requiredRoomId;
        } else {
            state.items.push({ subjectId, requiredRoomId, timePreference: TimePreference.ANY });
        }
    },
    setSubjectTimePreference: (state, action: PayloadAction<{ subjectId: number, timePreference: TimePreference }>) => {
        const { subjectId, timePreference } = action.payload;
        const existingIndex = state.items.findIndex(r => r.subjectId === subjectId);
        if (existingIndex > -1) {
            state.items[existingIndex].timePreference = timePreference;
        } else {
            state.items.push({ subjectId, requiredRoomId: null, timePreference });
        }
    },
    setAllSubjectRequirements(state, action: PayloadAction<SubjectRequirement[]>) {
        state.items = action.payload.map(item => ({
            ...item,
            requiredRoomId: item.requiredRoomId === undefined ? null : item.requiredRoomId,
            timePreference: item.timePreference || TimePreference.ANY
        }));
    }
  },
  selectors: {
    selectSubjectRequirements: (state) => state.items,
  },
});

export const { setSubjectRequirement, setAllSubjectRequirements, setSubjectTimePreference } = subjectRequirementsSlice.actions;
export const { selectSubjectRequirements } = subjectRequirementsSlice.selectors;
export default subjectRequirementsSlice.reducer;
