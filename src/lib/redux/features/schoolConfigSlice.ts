// src/lib/redux/features/schoolConfigSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SchoolData {
  name: string;
  startTime: string;
  endTime: string;
  schoolDays: string[];
  sessionDuration: number;
}

const initialState: SchoolData = {
  name: 'Collège Riadh 5',
  startTime: '08:00',
  endTime: '17:00',
  schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  sessionDuration: 60,
};

const schoolConfigSlice = createSlice({
  name: 'schoolConfig',
  initialState,
  reducers: {
    setSchoolConfig(state, action: PayloadAction<Partial<SchoolData>>) {
      // Merge with initial state to ensure all fields are always present,
      // preventing errors if a partial or empty config is loaded from a draft.
      return { ...initialState, ...action.payload };
    },
    updateSchoolConfig(state, action: PayloadAction<Partial<SchoolData>>) {
      // Ensure current state is always spread first to preserve existing values
      return { ...state, ...action.payload };
    },
  },
  selectors: {
    selectSchoolConfig: (state: SchoolData) => state,
  }
});

export const { setSchoolConfig, updateSchoolConfig } = schoolConfigSlice.actions;
export const { selectSchoolConfig } = schoolConfigSlice.selectors;
export default schoolConfigSlice.reducer;
