import { NextResponse } from 'next/server';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import {
  clearAuthCookies,
  getAccessToken,
  getGuestId,
  getRefreshToken,
  setAuthCookies,
} from '@/lib/api/bff/cookies';
import type { AuthResponse, AuthUser } from '@/lib/api/magento/types';

export interface SessionResponse {
  hasSession: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  user?: AuthUser;
}

export async function GET(request: Request) {
  const accessToken = getAccessToken(request);
  const refreshToken = getRefreshToken(request);
  const guestId = getGuestId(request);

  // 无任何 token
  if (!accessToken && !refreshToken) {
    return NextResponse.json<SessionResponse>({
      hasSession: false,
      isAuthenticated: false,
      isGuest: false,
    });
  }

  // 有 guest_id → guest session
  if (guestId) {
    return NextResponse.json<SessionResponse>({
      hasSession: true,
      isAuthenticated: false,
      isGuest: true,
    });
  }

  // 有 access_token，尝试获取用户信息
  if (accessToken) {
    try {
      const data = await magentoServerFetch<AuthResponse>('/api/auth/me', {
        accessToken,
      });
      return NextResponse.json<SessionResponse>({
        hasSession: true,
        isAuthenticated: true,
        isGuest: false,
        user: data.user,
      });
    } catch {
      // access_token 过期，尝试用 refresh_token 刷新
    }
  }

  // 尝试 refresh
  if (refreshToken) {
    try {
      const data = await magentoServerFetch<AuthResponse>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      const response = NextResponse.json<SessionResponse>({
        hasSession: true,
        isAuthenticated: true,
        isGuest: false,
        user: data.user,
      });
      setAuthCookies(response, data.tokens);
      return response;
    } catch {
      // refresh 也失败，清除 cookie
      const response = NextResponse.json<SessionResponse>({
        hasSession: false,
        isAuthenticated: false,
        isGuest: false,
      });
      return clearAuthCookies(response);
    }
  }

  return NextResponse.json<SessionResponse>({
    hasSession: false,
    isAuthenticated: false,
    isGuest: false,
  });
}
