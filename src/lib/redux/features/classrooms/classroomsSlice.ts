// src/lib/redux/features/classrooms/classroomsSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Classroom, CreateClassroomPayload } from '@/types';

export type ClassroomsState = {
  items: Array<Classroom>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: ClassroomsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchSalles = createAsyncThunk<Array<Classroom>, void, { rejectValue: string }>(
  'classrooms/fetchClassrooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/classrooms');
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de la récupération des salles');
      }
      const data: Array<Classroom> = await response.json();
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const addSalle = createAsyncThunk<Classroom, CreateClassroomPayload, { rejectValue: string }>(
  'classrooms/addClassroom',
  async (newClassroom, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClassroom),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de l\'ajout de la salle');
      }
      const data: Classroom = await response.json();
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const deleteSalle = createAsyncThunk<number, number, { rejectValue: string }>(
  'classrooms/deleteClassroom',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/classrooms/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de la suppression');
      }
      return id;
    } catch (error: unknown) {
       if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const classroomsSlice = createSlice({
  name: 'classrooms',
  initialState,
  reducers: {
    setAllClassrooms(state, action: PayloadAction<Classroom[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
    },
    localAddClassroom(state, action: PayloadAction<Classroom>) {
      state.items.push(action.payload);
      state.items.sort((a,b) => a.name.localeCompare(b.name));
    },
    localDeleteClassroom(state, action: PayloadAction<number>) {
      state.items = state.items.filter(c => c.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSalles.fulfilled, (state, action: PayloadAction<Array<Classroom>>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(addSalle.fulfilled, (state, action: PayloadAction<Classroom>) => {
        const index = state.items.findIndex(item => item.id < 0);
        if (index !== -1) {
            state.items[index] = action.payload;
        } else {
            state.items.push(action.payload);
        }
        state.items.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(deleteSalle.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter(s => s.id !== action.payload);
      })
      .addMatcher(
        (action): action is PayloadAction<string> => action.type.endsWith('/rejected'),
        (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        }
      );
  },
  selectors: {
    selectAllSalles: (state) => state.items,
    getSallesStatus: (state) => state.status,
    getSallesError: (state) => state.error,
  }
});

export const { setAllClassrooms, localAddClassroom, localDeleteClassroom } = classroomsSlice.actions;
export const { selectAllSalles, getSallesStatus, getSallesError } = classroomsSlice.selectors;
export default classroomsSlice.reducer;
