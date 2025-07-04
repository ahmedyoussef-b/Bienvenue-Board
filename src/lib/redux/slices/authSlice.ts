
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SafeUser } from '@/types';
import { authApi } from '../api/authApi';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Add User type for the simulated login in the chatroom login form
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatar?: string;
}


const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with true until the first session check completes
};

// Helper to check if an error is a FetchBaseQueryError
function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      // This is for the simulated chatroom login.
      // It does not set isAuthenticated to true for the whole app.
      console.warn("Chatroom demo login success. This does not affect main app authentication state.");
      state.isLoading = false;
    },
    manualLogout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authUser');
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addMatcher(authApi.endpoints.login.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
        if (typeof window !== 'undefined') { // Store user in localStorage
          localStorage.setItem('authUser', JSON.stringify(action.payload.user));
        }
      })
      .addMatcher(authApi.endpoints.login.matchRejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authUser');
        }
      })
      // Register
      .addMatcher(authApi.endpoints.register.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(authApi.endpoints.register.matchFulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
        if (typeof window !== 'undefined') {
          localStorage.setItem('authUser', JSON.stringify(action.payload.user));
        }
      })
      .addMatcher(authApi.endpoints.register.matchRejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authUser');
        }
      })
      // Logout
      .addMatcher(authApi.endpoints.logout.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authUser');
        }
      })
      .addMatcher(authApi.endpoints.logout.matchRejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authUser');
        }
      })
      // Check Session
      .addMatcher(authApi.endpoints.checkSession.matchPending, (state) => {
        if (!state.isAuthenticated || state.user === null) {
            state.isLoading = true;
        }
      })
      .addMatcher(authApi.endpoints.checkSession.matchFulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
         if (typeof window !== 'undefined') {
          localStorage.setItem('authUser', JSON.stringify(action.payload.user));
        }
      })
      .addMatcher(authApi.endpoints.checkSession.matchRejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authUser');
        }
      });
  },
  selectors: {
    selectCurrentUser: (state) => state.user,
    selectIsAuthenticated: (state) => state.isAuthenticated,
    selectIsAuthLoading: (state) => state.isLoading,
  }
});

export const { manualLogout, loginStart, loginSuccess } = authSlice.actions;
export const { selectCurrentUser, selectIsAuthenticated, selectIsAuthLoading } = authSlice.selectors;
export default authSlice.reducer;
