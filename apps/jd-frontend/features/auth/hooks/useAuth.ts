'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: number;
  email: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}

// ---------------------------------------------------------------------------
// Zustand store – singleton auth state shared across the app
// ---------------------------------------------------------------------------

const useAuthStore = create<AuthStore>(set => ({
  user: null,
  isLoading: true,
  setUser: (user: AuthUser | null) => set({ user, isLoading: false }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const AUTH_BASE_URL = '/api/auth';

// ---------------------------------------------------------------------------
// useAuth – the public hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  /** Check current login state via /auth/me */
  const checkSession = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${AUTH_BASE_URL}/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        const data = (await res.json()) as { user: AuthUser };
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [setUser, setLoading]);

  /** Login – POST /auth/login */
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        setError(null);

        const res = await fetch(`${AUTH_BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          const data = (await res.json()) as { user: AuthUser };
          setUser(data.user);
          return true;
        }

        const errData = (await res.json()) as { error?: string };
        setError(errData.error ?? 'Authentication failed');
        return false;
      } catch {
        setError('Network error. Please try again.');
        return false;
      }
    },
    [setUser]
  );

  /** Logout – POST /auth/logout */
  const logout = useCallback(async () => {
    try {
      await fetch(`${AUTH_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // best-effort – clear local state regardless
    }
    setUser(null);
  }, [setUser]);

  // ── Auto-check session on mount ────────────────────────────────────
  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  return {
    user,
    isLoading,
    isLoggedIn: user !== null,
    error,
    login,
    logout,
  };
}
