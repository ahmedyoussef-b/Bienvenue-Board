// src/lib/redux/features/scheduleDraftSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { ScheduleDraft } from '@/types';

interface DraftState {
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    saveStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    lastSaved: string | null;
    drafts: ScheduleDraft[];
    activeDraft: ScheduleDraft | null; // NEW: To hold the currently active draft
}

const initialState: DraftState = {
    status: 'idle',
    saveStatus: 'idle',
    error: null,
    lastSaved: null,
    drafts: [],
    activeDraft: null,
};

// --- ASYNC THUNKS ---

// Fetches the single ACTIVE draft
export const fetchScheduleDraft = createAsyncThunk<ScheduleDraft | null, void, { rejectValue: string }>(
    'scheduleDraft/fetchActive',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/schedule-drafts?active=true', { credentials: 'include' });
            if (!response.ok) {
                const errorData = await response.json();
                return rejectWithValue(errorData.message ?? 'Échec de la récupération du brouillon actif');
            }
            return await response.json();
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

// Creates a NEW draft (used for "Save As..." or initial creation)
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
            const response = await fetch('/api/schedule-drafts', {
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

// Updates the currently active draft (autosave)
export const updateActiveDraft = createAsyncThunk<
    ScheduleDraft,
    void,
    { state: RootState, rejectValue: string }
>(
    'scheduleDraft/updateActive',
    async (_, { getState, rejectWithValue }) => {
        console.log("REDUX [updateActiveDraft THUNK]: Called.");
        const state = getState();
        const { activeDraft } = state.scheduleDraft;
        if (!activeDraft) {
            console.error("REDUX [updateActiveDraft THUNK]: No active draft to update. Rejecting.");
            return rejectWithValue("Aucun scénario actif à mettre à jour.");
        }

        const draftPayload = {
            name: activeDraft.name,
            description: activeDraft.description,
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
            console.log(`REDUX [updateActiveDraft THUNK]: Sending PUT request to /api/schedule-drafts/${activeDraft.id}`);
            const response = await fetch(`/api/schedule-drafts/${activeDraft.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draftPayload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("REDUX [updateActiveDraft THUNK]: API request failed.", errorData);
                return rejectWithValue(errorData.message ?? 'Failed to update draft');
            }
            const responseData = await response.json();
            console.log("REDUX [updateActiveDraft THUNK]: API request successful.");
            return responseData;
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
            // After activating on the server, we fetch the newly activated draft to get all its data
            const getResponse = await fetch('/api/schedule-drafts?active=true');
            if (!getResponse.ok) {
                throw new Error("Failed to fetch the newly activated draft data.");
            }
            return await getResponse.json();
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : 'Unknown network error occurred');
        }
    }
)

const scheduleDraftSlice = createSlice({
    name: 'scheduleDraft',
    initialState,
    reducers: {
        updateActiveDraftDetails(state, action: PayloadAction<{ name?: string, description?: string }>) {
            if (state.activeDraft) {
                if (action.payload.name !== undefined) {
                    state.activeDraft.name = action.payload.name;
                }
                if (action.payload.description !== undefined) {
                    state.activeDraft.description = action.payload.description;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Active
            .addCase(fetchScheduleDraft.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchScheduleDraft.fulfilled, (state, action: PayloadAction<ScheduleDraft | null>) => {
                state.status = 'succeeded';
                state.activeDraft = action.payload;
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
            // Create ("Save As")
            .addCase(createDraft.pending, (state) => { state.saveStatus = 'loading'; })
            .addCase(createDraft.fulfilled, (state, action) => {
                state.saveStatus = 'succeeded';
                state.activeDraft = action.payload; // The new draft becomes active
                state.drafts.forEach(d => { d.isActive = false; });
                state.drafts.unshift(action.payload);
                state.lastSaved = action.payload.updatedAt;
            })
            .addCase(createDraft.rejected, (state, action) => {
                state.saveStatus = 'failed';
                state.error = action.payload ?? 'Failed to save draft.';
            })
            // Update (Autosave)
            .addCase(updateActiveDraft.pending, (state) => { 
                console.log("REDUX [scheduleDraftSlice REDUCER]: updateActiveDraft.pending");
                state.saveStatus = 'loading'; 
            })
            .addCase(updateActiveDraft.fulfilled, (state, action) => {
                console.log("REDUX [scheduleDraftSlice REDUCER]: updateActiveDraft.fulfilled. Payload updatedAt:", action.payload.updatedAt);
                state.saveStatus = 'succeeded';
                state.lastSaved = action.payload.updatedAt;
                 if (state.activeDraft) {
                  state.activeDraft.updatedAt = action.payload.updatedAt;
                }
            })
            .addCase(updateActiveDraft.rejected, (state, action) => {
                console.error("REDUX [scheduleDraftSlice REDUCER]: updateActiveDraft.rejected. Error:", action.payload);
                state.saveStatus = 'failed';
                state.error = action.payload ?? 'Autosave failed.';
            })
            // Delete
            .addCase(deleteDraft.fulfilled, (state, action) => {
                state.drafts = state.drafts.filter(d => d.id !== action.payload);
                if (state.activeDraft?.id === action.payload) {
                    state.activeDraft = null; // If the active draft was deleted, clear it
                }
            })
            // Activate
            .addCase(activateDraft.fulfilled, (state, action) => {
                state.activeDraft = action.payload; // The newly activated draft becomes active
                state.drafts = state.drafts.map(d => ({
                    ...d,
                    isActive: d.id === action.payload.id,
                }));
                 // Trigger a full reload by setting status to idle, forcing components to re-initialize
                state.status = 'idle';
            });
    },
    selectors: {
        selectDraftStatus: (state) => state.status,
        selectSaveStatus: (state) => state.saveStatus,
        selectLastSaved: (state) => state.lastSaved,
        selectAllDrafts: (state) => state.drafts,
        selectActiveDraft: (state) => state.activeDraft,
    },
});

export const { updateActiveDraftDetails } = scheduleDraftSlice.actions;
export const { selectDraftStatus, selectSaveStatus, selectLastSaved, selectAllDrafts, selectActiveDraft } = scheduleDraftSlice.selectors;
export default scheduleDraftSlice.reducer;
