// src/lib/redux/features/scheduleDraftSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface ScheduleDraft {
    [key: string]: any; // Allow any shape for now
}

interface DraftState {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    saveStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    lastSaved: string | null;
}

const initialState: DraftState = {
    status: 'idle',
    saveStatus: 'idle',
    error: null,
    lastSaved: null,
};

export const fetchScheduleDraft = createAsyncThunk<ScheduleDraft | null, void, { rejectValue: string }>(
    'scheduleDraft/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/schedule-draft', { credentials: 'include' });
            if (response.status === 204) { // Handle 204 No Content for non-existent drafts
                return null;
            }
            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message ?? 'Échec de la récupération du brouillon');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'An unknown network error occurred');
        }
    }
);

export const saveScheduleDraft = createAsyncThunk<
    { updatedAt: string }, 
    void, 
    { state: RootState, rejectValue: string }
>(
    'scheduleDraft/save',
    async (_, { getState, rejectWithValue }) => {
        const state = getState();
        const draftPayload = {
            schoolConfig: state.schoolConfig,
            classes: state.classes.items,
            subjects: state.subjects.items,
            teachers: state.teachers.items,
            classrooms: state.classrooms.items,
            grades: state.grades.items,
            lessonRequirements: state.lessonRequirements.items,
            teacherConstraints: state.teacherConstraints.items,
            subjectRequirements: state.subjectRequirements.items,
            teacherAssignments: state.teacherAssignments.items,
            schedule: state.schedule.items,
        };

        try {
            const response = await fetch('/api/schedule-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draftPayload),
                credentials: 'include', // Include cookies with the request
            });
            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message ?? 'Failed to save draft');
            }
            return await response.json();
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'An unknown network error occurred');
        }
    }
);

const scheduleDraftSlice = createSlice({
    name: 'scheduleDraft',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchScheduleDraft.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchScheduleDraft.fulfilled, (state, action: PayloadAction<ScheduleDraft | null>) => {
                state.status = 'succeeded';
                if (action.payload) { 
                    state.lastSaved = action.payload.updatedAt;
                } else {
                    state.lastSaved = null; 
                }
            })
            .addCase(fetchScheduleDraft.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to load draft.';
            })
            .addCase(saveScheduleDraft.pending, (state) => {
                state.saveStatus = 'loading';
            })
            .addCase(saveScheduleDraft.fulfilled, (state, action) => {
                state.saveStatus = 'succeeded';
                state.lastSaved = action.payload.updatedAt;
            })
            .addCase(saveScheduleDraft.rejected, (state, action) => {
                state.saveStatus = 'failed';
                state.error = action.payload ?? 'Failed to save draft.';
            });
    },
    selectors: {
        selectDraftStatus: (state) => state.status,
        selectSaveStatus: (state) => state.saveStatus,
        selectLastSaved: (state) => state.lastSaved,
    },
});

export const { selectDraftStatus, selectSaveStatus, selectLastSaved } = scheduleDraftSlice.selectors;
export default scheduleDraftSlice.reducer;
