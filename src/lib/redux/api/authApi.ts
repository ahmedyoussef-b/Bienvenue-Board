// src/lib/redux/api/authApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { SafeUser, Role } from '@/types/index';

export interface AuthResponse {
  message: string;
  user: SafeUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  role: Role;
  name?: string;
}

export interface SocialLoginRequest {
  email: string;
  name: string;
  imgUrl: string | null;
  role: Role | null;
}

export interface SessionResponse {
  user: SafeUser; 
}

export interface LogoutResponse {
    message: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/', credentials: 'include' }),
  tagTypes: ['UserSession'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: credentials,
      }),
      // We will invalidate tags manually or via the successful checkSession call
      // to avoid race conditions with the 2FA flow.
    }),
    socialLogin: builder.mutation<AuthResponse, SocialLoginRequest>({
      query: (userInfo) => ({
        url: '/api/auth/social-login',
        method: 'POST',
        body: userInfo,
      }),
      invalidatesTags: ['UserSession'],
    }),
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userInfo) => ({
        url: '/api/auth/register',
        method: 'POST',
        body: userInfo,
      }),
      invalidatesTags: ['UserSession'],
    }),
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: '/api/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['UserSession'],
    }),
    checkSession: builder.query<SessionResponse, void>({
      query: () => '/api/auth/session',
      providesTags: ['UserSession'],
    }),
    // New endpoint for 2FA verification - we define it but might not use it directly as a hook
    verify2FA: builder.mutation<AuthResponse, { token: string; code: string }>({
        query: (credentials) => ({
            url: '/api/auth/verify-2fa',
            method: 'POST',
            body: credentials,
        }),
        invalidatesTags: ['UserSession'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSocialLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useCheckSessionQuery,
  useVerify2FAMutation,
} = authApi;
