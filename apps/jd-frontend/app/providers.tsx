'use client';

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { SignupPromoController } from '@/shared/ui/SignupPromoController';
import { AuthProvider } from '@/features/auth/auth.context';
import { AuthModalProvider } from '@/features/auth/auth-modal.context';
import { CartProvider } from '@/features/cart/cart.context';
import { logger } from '@/core/observability/logger';

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
            <SignupPromoController />
            {children}
          </AppConfigProvider>
        </CartProvider>
      </AuthModalProvider>
    </AuthProvider>
  );
}
