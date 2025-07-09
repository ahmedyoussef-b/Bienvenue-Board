// src/lib/redux/features/schedule/scheduleSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Lesson, Day } from '@/types';

type SchedulableLesson = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Creates a Date object for a given day and time.
 * Assumes day is relative to the start of the week (Monday as 0).
 * Time is in "HH:mm" format.
 * Uses a fixed year (2000) and month (January) for date part as it only matters for day of the week and time.
 */
const createDateFromDayAndTime = (day: Day, time: string): Date => {
  const [hour, minute] = time.split(':').map(Number);
  // Use UTC to avoid timezone issues affecting hour calculation
  const date = new Date(Date.UTC(2000, 0, 1 + Number(day), hour, minute, 0)); // Adjust day based on Monday=0
  return date;
};

export type ScheduleState = {
  items: Lesson[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: ScheduleState = {
  items: [],
  status: 'idle',
  error: null,
};

export const saveSchedule = createAsyncThunk<Lesson[], SchedulableLesson[], { rejectValue: string }>(
  'schedule/saveSchedule',
  async (newSchedule, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/lessons/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: newSchedule }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        return rejectWithValue(errorData.message ?? 'Échec de la sauvegarde de l\'emploi du temps');
      }
      return newSchedule as Lesson[];
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setInitialSchedule(state, action: PayloadAction<SchedulableLesson[]>) {
      state.items = action.payload.map((lesson, index) => ({
        ...lesson,
        id: -(Date.now() + index), // Assign temporary negative ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })) as Lesson[];
      state.status = 'succeeded';
    },
    updateLessonSlot(state, action: PayloadAction<{ lessonId: number; newDay: Day; newTime: string }>) {
        const { lessonId, newDay, newTime } = action.payload;
        const lessonToUpdate = state.items.find(lesson => lesson.id === lessonId);
        if (lessonToUpdate) {
          const newStartDate = createDateFromDayAndTime(newDay, newTime);
          const durationMs = lessonToUpdate.endTime.getTime() - lessonToUpdate.startTime.getTime();
          const newEndDate = new Date(newStartDate.getTime() + durationMs);
          lessonToUpdate.day = newDay;
          lessonToUpdate.startTime = newStartDate;
          lessonToUpdate.endTime = newEndDate;
        }
    },
    updateLessonSubject(state, action: PayloadAction<{ lessonId: number; newSubjectId: number }>) {
      state.items = state.items.map(lesson =>
        lesson.id === action.payload.lessonId
          ? { ...lesson, subjectId: action.payload.newSubjectId }
          : lesson
      );
    },
    updateLessonRoom(state, action: PayloadAction<{ lessonId: number; classroomId: number | null }>) {
      const { lessonId, classroomId } = action.payload;
      state.items = state.items.map(lesson =>
        lesson.id === lessonId
          ? { ...lesson, classroomId: classroomId }
          : lesson
      );
    },
    addLesson(state, action: PayloadAction<SchedulableLesson>) {
      const tempId = -Date.now();
      const newLesson = { 
        ...action.payload, 
        id: tempId, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.items.push(newLesson as Lesson);
    },
    removeLesson(state, action: PayloadAction<number>) {
      // Use filter to create a new array, ensuring immutability
      state.items = state.items.filter(lesson => lesson.id !== action.payload);
    },
    extendLesson(state, action: PayloadAction<{ lessonId: number }>) {
      const lesson = state.items.find(l => l.id === action.payload.lessonId);
      if (lesson) {
        const endTime = new Date(lesson.endTime);
        endTime.setHours(endTime.getHours() + 1); // Assumes 1-hour extension
        lesson.endTime = endTime; // endTime is already a Date object, no need for toISOString
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveSchedule.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(saveSchedule.fulfilled, (state, action: PayloadAction<Lesson[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(saveSchedule.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to save schedule';
      });
  },
  selectors: {
    selectSchedule: (state) => state.items,
    selectScheduleStatus: (state) => state.status,
  }
});

export const { setInitialSchedule, updateLessonSlot, updateLessonSubject, updateLessonRoom, addLesson, removeLesson, extendLesson } = scheduleSlice.actions;
export const { selectSchedule, selectScheduleStatus } = scheduleSlice.selectors;
export default scheduleSlice.reducer;
