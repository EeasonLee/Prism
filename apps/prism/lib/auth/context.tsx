'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  refreshToken as apiRefresh,
} from '../api/magento/auth-api';
import { setMagentoTokenRefresher } from '../api/magento/client';
import type { AuthUser } from '../api/magento/types';

const STORAGE_KEY = 'magento_auth';

interface StoredAuth {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStorage(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

function writeStorage(data: StoredAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenStr, setRefreshTokenStr] = useState<string | null>(null);

  // 启动时从 localStorage 恢复
  useEffect(() => {
    const stored = readStorage();
    if (stored) {
      setUser(stored.user);
      setAccessToken(stored.accessToken);
      setRefreshTokenStr(stored.refreshToken);
    }
  }, []);

  // 向 Magento 客户端注入 token 获取和刷新逻辑
  useEffect(() => {
    const getter = () => accessToken;
    const refresher = async (): Promise<string | null> => {
      if (!refreshTokenStr) return null;
      try {
        const res = await apiRefresh(refreshTokenStr);
        setUser(res.user);
        setAccessToken(res.tokens.accessToken);
        setRefreshTokenStr(res.tokens.refreshToken);
        writeStorage({
          user: res.user,
          accessToken: res.tokens.accessToken,
          refreshToken: res.tokens.refreshToken,
        });
        return res.tokens.accessToken;
      } catch {
        // 刷新失败，清除登录状态
        setUser(null);
        setAccessToken(null);
        setRefreshTokenStr(null);
        clearStorage();
        return null;
      }
    };
    setMagentoTokenRefresher(getter, refresher);
  }, [accessToken, refreshTokenStr]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setUser(res.user);
    setAccessToken(res.tokens.accessToken);
    setRefreshTokenStr(res.tokens.refreshToken);
    writeStorage({
      user: res.user,
      accessToken: res.tokens.accessToken,
      refreshToken: res.tokens.refreshToken,
    });
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName?: string,
      lastName?: string
    ) => {
      const res = await apiRegister(email, password, firstName, lastName);
      setUser(res.user);
      setAccessToken(res.tokens.accessToken);
      setRefreshTokenStr(res.tokens.refreshToken);
      writeStorage({
        user: res.user,
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
      });
    },
    []
  );

  const logout = useCallback(() => {
    // 先调用 API 让服务端销毁 refresh token，失败也强制清除本地状态
    if (accessToken) {
      apiLogout(accessToken).catch(_err => {
        /* 失败也强制清除本地状态 */
      });
    }
    setUser(null);
    setAccessToken(null);
    setRefreshTokenStr(null);
    clearStorage();
  }, [accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!accessToken,
      login,
      register,
      logout,
    }),
    [user, accessToken, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
