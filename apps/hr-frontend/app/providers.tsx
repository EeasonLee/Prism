'use client';

import { PropsWithChildren, useEffect } from 'react';
import { logger } from '@/infrastructure/observability/logger';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    logger.info('Huaren Store app mounted', {
      logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL ?? 'info',
    });
  }, []);

  return children;
}
