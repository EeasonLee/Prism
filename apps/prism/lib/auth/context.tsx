'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  guestLogin as apiGuestLogin,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  refreshToken as apiRefresh,
} from '../api/magento/auth-api';
import { setMagentoTokenRefresher } from '../api/magento/client';
import type { AuthUser } from '../api/magento/types';

const USER_STORAGE_KEY = 'magento_auth';
const GUEST_STORAGE_KEY = 'magento_guest_auth';

interface StoredAuth {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface StoredGuestAuth {
  guestId: string;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
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

function readUserStorage(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

function writeUserStorage(data: StoredAuth) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
}

function clearUserStorage() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

function readGuestStorage(): StoredGuestAuth | null {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredGuestAuth) : null;
  } catch {
    return null;
  }
}

function writeGuestStorage(data: StoredGuestAuth) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
}

function clearGuestStorage() {
  localStorage.removeItem(GUEST_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenStr, setRefreshTokenStr] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  // 防止并发 guest 初始化
  const guestInitRef = useRef(false);

  // 启动时恢复登录态或初始化游客身份
  useEffect(() => {
    const stored = readUserStorage();
    if (stored) {
      setUser(stored.user);
      setAccessToken(stored.accessToken);
      setRefreshTokenStr(stored.refreshToken);
      setIsGuest(false);
      return;
    }

    // 无注册用户 token，尝试恢复或新建 guest
    const storedGuest = readGuestStorage();
    if (storedGuest) {
      setAccessToken(storedGuest.accessToken);
      setRefreshTokenStr(storedGuest.refreshToken);
      setIsGuest(true);
      return;
    }

    // 全新访客，获取 guest token
    void initGuest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initGuest = useCallback(async () => {
    if (guestInitRef.current) return;
    guestInitRef.current = true;
    try {
      const res = await apiGuestLogin();
      setAccessToken(res.tokens.accessToken);
      setRefreshTokenStr(res.tokens.refreshToken);
      setIsGuest(true);
      writeGuestStorage({
        guestId: res.guest_id,
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
      });
    } catch {
      // guest 初始化失败静默处理，功能降级为无 token 状态
    } finally {
      guestInitRef.current = false;
    }
  }, []);

  // 向 Magento 客户端注入 token 获取和刷新逻辑
  useEffect(() => {
    const getter = () => accessToken;
    const refresher = async (): Promise<string | null> => {
      if (!refreshTokenStr) return null;
      try {
        if (isGuest) {
          // 游客 refresh token 过期（24h），重新获取新 guest 身份
          const res = await apiGuestLogin();
          setAccessToken(res.tokens.accessToken);
          setRefreshTokenStr(res.tokens.refreshToken);
          writeGuestStorage({
            guestId: res.guest_id,
            accessToken: res.tokens.accessToken,
            refreshToken: res.tokens.refreshToken,
          });
          return res.tokens.accessToken;
        }

        const res = await apiRefresh(refreshTokenStr);
        setUser(res.user);
        setAccessToken(res.tokens.accessToken);
        setRefreshTokenStr(res.tokens.refreshToken);
        writeUserStorage({
          user: res.user,
          accessToken: res.tokens.accessToken,
          refreshToken: res.tokens.refreshToken,
        });
        return res.tokens.accessToken;
      } catch {
        if (isGuest) {
          // guest refresh 失败，尝试重新初始化 guest
          clearGuestStorage();
          setAccessToken(null);
          setRefreshTokenStr(null);
          void initGuest();
        } else {
          setUser(null);
          setAccessToken(null);
          setRefreshTokenStr(null);
          setIsGuest(false);
          clearUserStorage();
        }
        return null;
      }
    };
    setMagentoTokenRefresher(getter, refresher);
  }, [accessToken, refreshTokenStr, isGuest, initGuest]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    // 清除 guest 状态和购物车标记
    clearGuestStorage();
    localStorage.removeItem('magento_cart_created');
    setUser(res.user);
    setAccessToken(res.tokens.accessToken);
    setRefreshTokenStr(res.tokens.refreshToken);
    setIsGuest(false);
    writeUserStorage({
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
      // 清除 guest 状态和购物车标记
      clearGuestStorage();
      localStorage.removeItem('magento_cart_created');
      setUser(res.user);
      setAccessToken(res.tokens.accessToken);
      setRefreshTokenStr(res.tokens.refreshToken);
      setIsGuest(false);
      writeUserStorage({
        user: res.user,
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
      });
    },
    []
  );

  const logout = useCallback(() => {
    if (accessToken && !isGuest) {
      apiLogout(accessToken).catch(() => {
        /* 失败也强制清除本地状态 */
      });
    }
    clearUserStorage();
    localStorage.removeItem('magento_cart_created');
    setUser(null);
    setIsGuest(false);
    // 登出后重新初始化 guest 身份
    void initGuest();
  }, [accessToken, isGuest, initGuest]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !isGuest,
      isGuest,
      login,
      register,
      logout,
    }),
    [user, accessToken, isGuest, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
