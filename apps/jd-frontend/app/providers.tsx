'use client';

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';
import { ImageConfigContext } from '@prism/ui';
import { AuthProvider } from '../features/auth/provider';

type AppConfig = {
  appName: string;
};

const AppConfigContext = createContext<AppConfig>({ appName: 'Prism' });

export function useAppConfig() {
  return useContext(AppConfigContext);
}

export function AppProviders({ children }: PropsWithChildren) {
  const appConfig = useMemo<AppConfig>(() => ({ appName: 'Prism' }), []);
  const imageConfig = useMemo(
    () => ({
      baseUrl: process.env['NEXT_PUBLIC_IMAGE_BASE_URL'] ?? '',
      domainRewriteMap: {},
    }),
    []
  );

  return (
    <AppConfigContext.Provider value={appConfig}>
      <ImageConfigContext.Provider value={imageConfig}>
        <AuthProvider>{children}</AuthProvider>
      </ImageConfigContext.Provider>
    </AppConfigContext.Provider>
  );
}
