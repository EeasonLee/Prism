'use client';

import { createContext, useContext, PropsWithChildren, useMemo } from 'react';

type AppConfig = {
  appName: string;
};

const AppConfigContext = createContext<AppConfig>({ appName: 'Prism' });

export function useAppConfig() {
  return useContext(AppConfigContext);
}

export function AppProviders({ children }: PropsWithChildren) {
  const value = useMemo<AppConfig>(() => ({ appName: 'Prism' }), []);

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}
