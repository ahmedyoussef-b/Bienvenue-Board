
"use client";

import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { useCheckSessionQuery } from '@/lib/redux/api/authApi';
import type React from 'react';

function SessionInitializer({ children }: { children: React.ReactNode }) {
  // This hook call triggers the session check on initial load.
  // The result of this query will update the authSlice via extraReducers in authSlice.ts.
  useCheckSessionQuery();

  // Individual pages like page.tsx handle their own loading state based on auth status,
  // so no global loader is needed here. This component just ensures the session check is initiated.
  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionInitializer>{children}</SessionInitializer>
    </Provider>
  );
}
