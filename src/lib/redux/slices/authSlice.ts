// src/lib/redux/slices/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SafeUser, Role } from '@/types/index';
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
      console.log("➡️ [authSlice] manualLogout: Clearing user state.");
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
      console.log("✅ [authSlice] Handling auth success. User:", action.payload.user.username);
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('authUser', JSON.stringify(action.payload.user));
      }
    };

    // Rejected handler for all failed auth mutations
    const handleAuthFailure = (state: AuthState) => {
      console.log("❌ [authSlice] Handling auth failure. Clearing user state.");
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
        authApi.endpoints.login.matchFulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          console.log("✅ [authSlice] login.matchFulfilled. Payload:", action.payload);
          if ('user' in action.payload) {
            handleAuthSuccess(state, action as PayloadAction<AuthResponse>);
          } else {
            console.log("[authSlice] 2FA required. Auth state not changed.");
          }
        }
      )
      .addMatcher(
        authApi.endpoints.login.matchRejected,
        (state, action) => {
          console.error("❌ [authSlice] login.matchRejected. Error:", action.error.message);
          handleAuthFailure(state);
        }
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
        authApi.endpoints.socialLogin.matchFulfilled,
        handleAuthSuccess
      )
      .addMatcher(
        authApi.endpoints.socialLogin.matchRejected,
        handleAuthFailure
      )
      // Logout
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
         console.log("✅ [authSlice] logout.matchFulfilled. Clearing user state.");
         handleAuthFailure(state);
      })
      .addMatcher(authApi.endpoints.logout.matchRejected, (state, action) => {
        console.error("❌ [authSlice] logout.matchRejected. Error:", action.error.message);
        handleAuthFailure(state)
      }) // Also handle failure case for logout
      // Check Session
      .addMatcher(authApi.endpoints.checkSession.matchPending, (state) => {
        if (!state.isAuthenticated || state.user === null) {
            console.log("⏳ [authSlice] checkSession.matchPending: No user found, setting isLoading = true");
            state.isLoading = true;
        }
      })
      .addMatcher(authApi.endpoints.checkSession.matchFulfilled, (state, action) => {
        console.log("✅ [authSlice] checkSession.matchFulfilled. Session is valid. User:", action.payload.user.username);
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
         if (typeof window !== 'undefined') {
          localStorage.setItem('authUser', JSON.stringify(action.payload.user));
        }
      })
      .addMatcher(authApi.endpoints.checkSession.matchRejected, (state, action) => {
        console.log("❌ [authSlice] checkSession.matchRejected. Clearing user state. Error:", action.error.message);
        handleAuthFailure(state);
      })
       // Verify 2FA
      .addMatcher(
        authApi.endpoints.verify2FA.matchFulfilled,
        (state, action) => {
            console.log("✅ [authSlice] verify2FA.matchFulfilled. Calling handleAuthSuccess.");
            handleAuthSuccess(state, action);
        }
      )
      .addMatcher(
        authApi.endpoints.verify2FA.matchRejected,
        (state, action) => {
          console.error("❌ [authSlice] verify2FA.matchRejected. Error:", action.error.message);
          handleAuthFailure(state);
        }
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
