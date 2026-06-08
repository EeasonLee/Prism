'use client';

import { type PropsWithChildren } from 'react';
import { useAuth } from './hooks/useAuth';

/**
 * AuthProvider triggers the session check on mount.
 * The useAuth hook's singleton zustand store means only the first
 * call performs the fetch; all subsequent consumers read cached state.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  // Trigger session check on mount
  useAuth();

  return children;
}
