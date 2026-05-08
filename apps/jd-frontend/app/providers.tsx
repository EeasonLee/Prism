'use client';

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
} from 'react';
// import { SignupPromoController } from '@/app/_ui/SignupPromoController';
import { AuthProvider } from '@/features/auth';
import { AuthModalProvider } from '@/features/auth';
import { CartProvider } from '@/features/cart';
import { logger } from '@/infrastructure/observability/logger';
import { ImageConfigContext } from '@prism/ui';

type AppConfig = {
  appName: string;
};

const AppConfigContext = createContext<AppConfig>({ appName: 'Prism' });

export function useAppConfig() {
  return useContext(AppConfigContext);
}

function ImageConfigProvider({ children }: PropsWithChildren) {
  const value = useMemo(
    () => ({
      baseUrl: process.env['NEXT_PUBLIC_IMAGE_BASE_URL'] || '',
    }),
    []
  );

  return (
    <ImageConfigContext.Provider value={value}>
      {children}
    </ImageConfigContext.Provider>
  );
}

function AppConfigProvider({ children }: PropsWithChildren) {
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

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <AuthModalProvider>
        <CartProvider>
          <AppConfigProvider>
            <ImageConfigProvider>
              {/* <SignupPromoController /> */}
              {children}
            </ImageConfigProvider>
          </AppConfigProvider>
        </CartProvider>
      </AuthModalProvider>
    </AuthProvider>
  );
}
