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
    updateTeacherAssignment(state, action: PayloadAction<TeacherAssignment>) {
      const { teacherId, subjectId, classIds } = action.payload;

      // When a class is added to a teacher, remove it from all other teachers for the same subject.
      // This enforces the "one teacher per subject per class" rule.
      classIds.forEach(classId => {
        state.items.forEach(assignment => {
          if (assignment.subjectId === subjectId && assignment.teacherId !== teacherId) {
            // Remove the classId from the other teacher's assignment list
            assignment.classIds = assignment.classIds.filter(id => id !== classId);
          }
        });
      });

      // Find or create the assignment for the current teacher.
      const existingIndex = state.items.findIndex(
        (a) => a.teacherId === teacherId && a.subjectId === subjectId
      );

      if (existingIndex > -1) {
        state.items[existingIndex].classIds = classIds;
      } else {
        // If it's a new assignment, add it.
        state.items.push(action.payload);
      }

      // Clean up any assignments that are now empty.
      state.items = state.items.filter(a => a.classIds.length > 0);
    },
    clearAllAssignments(state) {
        state.items = [];
    }
  },
  selectors: {
    selectTeacherAssignments: (state) => state.items,
  }
});

export const { setAllTeacherAssignments, updateTeacherAssignment, clearAllAssignments } = teacherAssignmentsSlice.actions;
export const { selectTeacherAssignments } = teacherAssignmentsSlice.selectors;
export default teacherAssignmentsSlice.reducer;
