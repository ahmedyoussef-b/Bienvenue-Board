// src/lib/redux/slices/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SafeUser } from '@/types';
import { authApi, type LoginResponse, type AuthResponse } from '../api/authApi';
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
    // Fulfilled handler for all successful auth mutations that return AuthResponse
    const handleAuthSuccess = (state: AuthState, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('authUser', JSON.stringify(action.payload.user));
      }
    };

    // Rejected handler for all failed auth mutations
    const handleAuthFailure = (state: AuthState) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authUser');
      }
    };
    
    builder
      // Login, Register, SocialLogin
      .addMatcher(
        authApi.endpoints.login.matchPending,
        (state) => { 
          state.isLoading = true; 
        }
      )
      .addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          if ('user' in action.payload) {
            handleAuthSuccess(state, action as PayloadAction<AuthResponse>);
          }
        }
      )
      .addMatcher(
        authApi.endpoints.login.matchRejected,
        handleAuthFailure
      )
      .addMatcher(
        authApi.endpoints.register.matchPending,
        (state) => { state.isLoading = true; }
      )
      .addMatcher(
        authApi.endpoints.register.matchFulfilled,
        handleAuthSuccess
      )
      .addMatcher(
        authApi.endpoints.register.matchRejected,
        handleAuthFailure
      )
       .addMatcher(
        authApi.endpoints.socialLogin.matchPending,
        (state) => { state.isLoading = true; }
      )
      .addMatcher(
        authApi.endpoints.socialLogin.matchFulfilled,
        handleAuthSuccess
      )
      .addMatcher(
        authApi.endpoints.socialLogin.matchRejected,
        handleAuthFailure
      )
      // Logout
      .addMatcher(authApi.endpoints.logout.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, handleAuthFailure)
      .addMatcher(authApi.endpoints.logout.matchRejected, handleAuthFailure) // Also handle failure case for logout
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
      .addMatcher(authApi.endpoints.checkSession.matchRejected, handleAuthFailure)
       // Verify 2FA (Handles the final step of admin login)
      .addMatcher(
        authApi.endpoints.verify2FA.matchFulfilled,
        handleAuthSuccess
      );
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
