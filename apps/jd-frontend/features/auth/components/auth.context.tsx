'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthUser, SessionResponse } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  hasSession: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    turnstileToken?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<SessionResponse>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function waitForSessionEstablished(
  refreshSession: () => Promise<SessionResponse>,
  maxAttempts = 4
): Promise<SessionResponse> {
  let latest = await refreshSession();
  if (latest.isAuthenticated) {
    return latest;
  }

  for (let attempt = 1; attempt < maxAttempts; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 120 * attempt));
    latest = await refreshSession();
    if (latest.isAuthenticated) {
      return latest;
    }
  }

  return latest;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async (): Promise<SessionResponse> => {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = (await res.json()) as SessionResponse;
      setHasSession(data.hasSession);
      setIsAuthenticated(data.isAuthenticated);
      setIsGuest(data.isGuest);
      setUser(data.user ?? null);
      return data;
    } catch {
      setHasSession(false);
      setIsAuthenticated(false);
      setIsGuest(false);
      setUser(null);
      return {
        hasSession: false,
        isAuthenticated: false,
        isGuest: false,
      };
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const session = await refreshSession();
      if (!session.hasSession) {
        try {
          await fetch('/api/auth/guest', {
            method: 'POST',
            credentials: 'include',
          });
          await refreshSession();
        } catch {
          // guest 初始化失败，静默处理
        }
      }
      setIsLoading(false);
    };
    void initSession();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message ?? 'Login failed');
      }
      const session = await waitForSessionEstablished(refreshSession);
      if (!session.isAuthenticated) {
        throw new Error('Login succeeded but session was not established');
      }
    },
    [refreshSession]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string,
      turnstileToken?: string
    ) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          turnstile_token: turnstileToken,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message ?? 'Registration failed');
      }
      const session = await waitForSessionEstablished(refreshSession);
      if (!session.isAuthenticated) {
        throw new Error(
          'Registration succeeded but session was not established'
        );
      }
    },
    [refreshSession]
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      /* 失败也继续 */
    });
    await refreshSession().catch(() => {
      setUser(null);
      setIsAuthenticated(false);
      setIsGuest(false);
      setHasSession(false);
    });
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      hasSession,
      isAuthenticated,
      isGuest,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
    }),
    [
      user,
      hasSession,
      isAuthenticated,
      isGuest,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
