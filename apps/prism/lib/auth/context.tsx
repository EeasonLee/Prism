'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AuthUser } from '../api/magento/types';

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
    lastName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface SessionResponse {
  hasSession: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  user?: AuthUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      const data = (await res.json()) as SessionResponse;
      setHasSession(data.hasSession);
      setIsAuthenticated(data.isAuthenticated);
      setIsGuest(data.isGuest);
      setUser(data.user ?? null);
    } catch {
      setHasSession(false);
      setIsAuthenticated(false);
      setIsGuest(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      await refreshSession();
      const currentHasSession = hasSession;
      if (!currentHasSession) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
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
    const data = await res.json();
    setUser(data.user);
    setIsAuthenticated(true);
    setIsGuest(false);
    setHasSession(true);
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string
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
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message ?? 'Registration failed');
      }
      const data = await res.json();
      setUser(data.user);
      setIsAuthenticated(true);
      setIsGuest(false);
      setHasSession(true);
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      /* 失败也继续 */
    });
    setUser(null);
    setIsAuthenticated(false);
    setIsGuest(true);
    setHasSession(true);
  }, []);

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
