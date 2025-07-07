// src/lib/redux/features/scheduleDraftSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { ScheduleDraft } from '@/types';

interface DraftState {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    saveStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    lastSaved: string | null;
    drafts: ScheduleDraft[]; // To hold the list of all drafts
}

const initialState: DraftState = {
    status: 'idle',
    saveStatus: 'idle',
    error: null,
    lastSaved: null,
    drafts: [],
};

// Fetches the single ACTIVE draft
export const fetchScheduleDraft = createAsyncThunk<ScheduleDraft | null, void, { rejectValue: string }>(
    'scheduleDraft/fetchActive',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/schedule-draft', { credentials: 'include' });
            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message ?? 'Échec de la récupération du brouillon actif');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'An unknown network error occurred');
        }
    }
);

// Fetches ALL drafts for the current user
export const fetchAllDrafts = createAsyncThunk<ScheduleDraft[], void, { rejectValue: string }>(
    'scheduleDraft/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/schedule-drafts', { credentials: 'include' });
            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message ?? 'Échec de la récupération de la liste des brouillons');
            }
            return await response.json();
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'An unknown network error occurred');
        }
    }
);

// Creates a NEW draft
export const createDraft = createAsyncThunk<
    ScheduleDraft,
    { name: string; description?: string },
    { state: RootState, rejectValue: string }
>(
    'scheduleDraft/create',
    async ({ name, description }, { getState, rejectWithValue }) => {
        const state = getState();
        const draftPayload = {
            name,
            description,
            initialData: {
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
            }
        };

        try {
            const response = await fetch('/api/schedule-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draftPayload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message ?? 'Failed to create draft');
            }
            return await response.json();
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'An unknown network error occurred');
        }
    }
);

// Deletes a draft
export const deleteDraft = createAsyncThunk<string, string, { rejectValue: string }>(
    'scheduleDraft/delete',
    async (draftId, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/schedule-drafts/${draftId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message ?? 'Failed to delete draft');
            }
            return draftId;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Unknown network error occurred');
        }
    }
);

// Activates a draft
export const activateDraft = createAsyncThunk<ScheduleDraft, string, { rejectValue: string }>(
    'scheduleDraft/activate',
    async (draftId, { rejectWithValue }) => {
         try {
            const response = await fetch(`/api/schedule-drafts/${draftId}/activate`, { method: 'POST' });
            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message ?? 'Failed to activate draft');
            }
            return await response.json();
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Unknown network error occurred');
        }
    }
)

const scheduleDraftSlice = createSlice({
    name: 'scheduleDraft',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Active
            .addCase(fetchScheduleDraft.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchScheduleDraft.fulfilled, (state, action: PayloadAction<ScheduleDraft | null>) => {
                state.status = 'succeeded';
                if (action.payload) { state.lastSaved = action.payload.updatedAt; } 
                else { state.lastSaved = null; }
            })
            .addCase(fetchScheduleDraft.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload ?? 'Failed to load draft.';
            })
            // Fetch All
            .addCase(fetchAllDrafts.fulfilled, (state, action) => {
                state.drafts = action.payload;
            })
            // Create
            .addCase(createDraft.pending, (state) => { state.saveStatus = 'loading'; })
            .addCase(createDraft.fulfilled, (state, action) => {
                state.saveStatus = 'succeeded';
                state.drafts.unshift(action.payload); // Add new draft to the list
                // Deactivate old active draft in the list
                state.drafts.forEach(d => { if(d.id !== action.payload.id) d.isActive = false; });
                state.lastSaved = action.payload.updatedAt;
            })
            .addCase(createDraft.rejected, (state, action) => {
                state.saveStatus = 'failed';
                state.error = action.payload ?? 'Failed to save draft.';
            })
            // Delete
            .addCase(deleteDraft.fulfilled, (state, action) => {
                state.drafts = state.drafts.filter(d => d.id !== action.payload);
            })
            // Activate
            .addCase(activateDraft.fulfilled, (state, action) => {
                state.drafts = state.drafts.map(d => ({
                    ...d,
                    isActive: d.id === action.payload.id,
                }));
            });
    },
    selectors: {
        selectDraftStatus: (state) => state.status,
        selectSaveStatus: (state) => state.saveStatus,
        selectLastSaved: (state) => state.lastSaved,
        selectAllDrafts: (state) => state.drafts,
    },
});

export const { selectDraftStatus, selectSaveStatus, selectLastSaved, selectAllDrafts } = scheduleDraftSlice.selectors;
export default scheduleDraftSlice.reducer;
