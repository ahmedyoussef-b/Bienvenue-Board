
"use client";

import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { useCheckSessionQuery } from '@/lib/redux/api/authApi';
import type React from 'react';
import { useEffect } from 'react';

function SessionInitializer({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading, isFetching, isSuccess, isError } = useCheckSessionQuery();

  useEffect(() => {
    console.log('--- [SessionInitializer] Vérification de la session ---');
    if (isLoading || isFetching) {
      console.log('🔄 [SessionInitializer] Requête de session en cours...');
    }
    if (isSuccess && data) {
      console.log('✅ [SessionInitializer] Session vérifiée avec succès. Utilisateur:', data.user);
    }
    if (isError) {
      console.error('❌ [SessionInitializer] Échec de la vérification de session. Erreur:', error);
    }
  }, [data, error, isLoading, isFetching, isSuccess, isError]);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionInitializer>{children}</SessionInitializer>
    </Provider>
  );
}
