
"use client";

import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { useCheckSessionQuery } from '@/lib/redux/api/authApi';
import type React from 'react';

function SessionInitializer({ children }: { children: React.ReactNode }) {
  // This hook will attempt to fetch the session on component mount.
  // The result will be handled by the authSlice extraReducers.
  useCheckSessionQuery();

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionInitializer>{children}</SessionInitializer>
    </Provider>
  );
}
