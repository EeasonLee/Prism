/**
 * BFF Cookie 工具（服务端专用，禁止在客户端代码中引入）
 */

import { NextResponse } from 'next/server';
import type { AuthTokens } from '../magento/types';

export type { AuthTokens };

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const GUEST_ID_COOKIE = 'guest_id';

const ACCESS_TOKEN_MAX_AGE = 30 * 60; // 30 分钟
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 天

const BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setAuthCookies(
  response: NextResponse,
  tokens: AuthTokens,
  guestId?: string
): NextResponse {
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...BASE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...BASE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
  if (guestId !== undefined) {
    response.cookies.set(GUEST_ID_COOKIE, guestId, {
      ...BASE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }
  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  for (const name of [
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    GUEST_ID_COOKIE,
  ]) {
    response.cookies.set(name, '', { ...BASE_OPTIONS, maxAge: 0 });
  }
  return response;
}

export function getAccessToken(request: Request): string | null {
  return getCookieFromRequest(request, ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(request: Request): string | null {
  return getCookieFromRequest(request, REFRESH_TOKEN_COOKIE);
}

export function getGuestId(request: Request): string | null {
  return getCookieFromRequest(request, GUEST_ID_COOKIE);
}

function getCookieFromRequest(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key?.trim() === name) {
      return rest.join('=').trim() || null;
    }
  }
  return null;
}
