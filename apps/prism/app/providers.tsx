'use client';

import {
  createContext,
  useContext,
  PropsWithChildren,
  useMemo,
  useEffect,
} from 'react';
import { logger } from '../lib/observability/logger';

type AppConfig = {
  appName: string;
};

const AppConfigContext = createContext<AppConfig>({ appName: 'Prism' });

export function useAppConfig() {
  return useContext(AppConfigContext);
}

export function AppProviders({ children }: PropsWithChildren) {
  const value = useMemo<AppConfig>(() => ({ appName: 'Prism' }), []);

  useEffect(() => {
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
