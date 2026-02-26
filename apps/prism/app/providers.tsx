'use client';

import { setApiClient } from '@prism/blog';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { apiClient } from '../lib/api/client';
import { AuthProvider } from '../lib/auth/context';
import { CartProvider } from '../lib/cart/context';
import { logger } from '../lib/observability/logger';

type AppConfig = {
  appName: string;
};

const AppConfigContext = createContext<AppConfig>({ appName: 'Prism' });

export function useAppConfig() {
  return useContext(AppConfigContext);
}

function AppConfigProvider({ children }: PropsWithChildren) {
  const value = useMemo<AppConfig>(() => ({ appName: 'Prism' }), []);

  useEffect(() => {
    // 在客户端初始化 Blog API Client
    setApiClient(apiClient);

    logger.info('AppProviders mounted', {
      logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL ?? 'info',
    });
  }, []);

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <CartProvider>
        <AppConfigProvider>{children}</AppConfigProvider>
      </CartProvider>
    </AuthProvider>
  );
}
