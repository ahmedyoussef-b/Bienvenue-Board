// src/lib/redux/features/teacherConstraintsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { Day } from '@/types';

export interface TeacherConstraint {
  id: string;
  teacherId: string;
  day: Day;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  description: string;
}

const initialState: { items: TeacherConstraint[] } = {
  items: [],
};

const teacherConstraintsSlice = createSlice({
  name: 'teacherConstraints',
  initialState,
  reducers: {
    addTeacherConstraint: (state, action: PayloadAction<TeacherConstraint>) => {
      state.items.push(action.payload);
    },
    removeTeacherConstraint: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(c => c.id !== action.payload);
    },
    setAllTeacherConstraints(state, action: PayloadAction<TeacherConstraint[]>) {
        state.items = action.payload;
    }
  },
  selectors: {
    selectTeacherConstraints: (state) => state.items,
  }
});

export const { addTeacherConstraint, removeTeacherConstraint, setAllTeacherConstraints } = teacherConstraintsSlice.actions;
export const { selectTeacherConstraints } = teacherConstraintsSlice.selectors;
export default teacherConstraintsSlice.reducer;
