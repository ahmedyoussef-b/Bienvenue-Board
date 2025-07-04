// src/lib/redux/features/subjects/subjectsSlice.ts
import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { Subject, CreateSubjectPayload } from '@/types';

export type SubjectsState = {
  items: Array<Subject>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: SubjectsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchMatieres = createAsyncThunk<Array<Subject>, void, { rejectValue: string }>(
  'subjects/fetchSubjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/subjects');
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de la récupération des matières');
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const addMatiere = createAsyncThunk<Subject, CreateSubjectPayload, { rejectValue: string }>(
  'subjects/addSubject',
  async (newSubject, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject),
      });
       if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de l\'ajout de la matière');
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const deleteMatiere = createAsyncThunk<number, number, { rejectValue: string }>(
  'subjects/deleteSubject',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message ?? 'Échec de la suppression');
      }
      return id;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown network error occurred');
    }
  }
);

export const subjectsSlice = createSlice({
  name: 'subjects',
  initialState,
  reducers: {
    setAllSubjects(state, action: PayloadAction<Subject[]>) {
      state.items = action.payload;
      state.status = 'succeeded';
    },
    localAddSubject(state, action: PayloadAction<Subject>) {
        state.items.push(action.payload);
        state.items.sort((a,b) => a.name.localeCompare(b.name));
    },
    localDeleteSubject(state, action: PayloadAction<number>) {
        state.items = state.items.filter(s => s.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatieres.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMatieres.fulfilled, (state, action: PayloadAction<Array<Subject>>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(addMatiere.fulfilled, (state, action: PayloadAction<Subject>) => {
        const index = state.items.findIndex(item => item.id < 0);
        if (index !== -1) {
            state.items[index] = action.payload;
        } else {
            state.items.push(action.payload);
        }
        state.items.sort((a,b) => a.name.localeCompare(b.name));
      })
      .addCase(deleteMatiere.fulfilled, (state, action: PayloadAction<number>) => {
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
    selectAllMatieres: (state) => state.items,
    getMatieresStatus: (state) => state.status,
    getMatieresError: (state) => state.error,
  }
});

export const { setAllSubjects, localAddSubject, localDeleteSubject } = subjectsSlice.actions;
export const { selectAllMatieres, getMatieresStatus, getMatieresError } = subjectsSlice.selectors;
export default subjectsSlice.reducer;
