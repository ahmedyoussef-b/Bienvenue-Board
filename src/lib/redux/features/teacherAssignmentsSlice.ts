// src/lib/redux/features/teacherAssignmentsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface TeacherAssignment {
  teacherId: string;
  subjectId: number;
  classIds: number[];
}

export type TeacherAssignmentsState = {
  items: TeacherAssignment[];
};

const initialState: TeacherAssignmentsState = {
  items: [],
};

export const teacherAssignmentsSlice = createSlice({
  name: 'teacherAssignments',
  initialState,
  reducers: {
    setAllTeacherAssignments(state, action: PayloadAction<TeacherAssignment[]>) {
      state.items = action.payload;
    },
    setAssignment(state, action: PayloadAction<{ classId: number, subjectId: number, teacherId: string | null }>) {
      const { classId, subjectId, teacherId: newTeacherId } = action.payload;

      // Find and remove the old assignment for this class/subject combo
      state.items.forEach(assignment => {
        if (assignment.subjectId === subjectId && assignment.classIds.includes(classId)) {
          assignment.classIds = assignment.classIds.filter(id => id !== classId);
        }
      });
      
      // Clean up any assignments that are now empty
      state.items = state.items.filter(a => a.classIds.length > 0);

      // Add the new assignment
      if (newTeacherId) {
        const existingAssignmentIndex = state.items.findIndex(
          a => a.teacherId === newTeacherId && a.subjectId === subjectId
        );

        if (existingAssignmentIndex > -1) {
          // Add class to existing assignment for the new teacher
          state.items[existingAssignmentIndex].classIds.push(classId);
        } else {
          // Create a new assignment for the new teacher
          state.items.push({
            teacherId: newTeacherId,
            subjectId: subjectId,
            classIds: [classId],
          });
        }
      }
    },
    clearAllAssignments(state) {
        state.items = [];
    }
  },
  selectors: {
    selectTeacherAssignments: (state) => state.items,
  }
});

export const { setAllTeacherAssignments, setAssignment, clearAllAssignments } = teacherAssignmentsSlice.actions;
export const { selectTeacherAssignments } = teacherAssignmentsSlice.selectors;
export default teacherAssignmentsSlice.reducer;
