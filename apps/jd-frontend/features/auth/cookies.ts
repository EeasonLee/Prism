import { NextResponse } from 'next/server';
import type { AuthTokens } from './types';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const GUEST_ID_COOKIE = 'guest_id';
export const CART_ID_COOKIE = 'magento_cart_id';

const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

const BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setSessionCookies<T>(
  response: NextResponse<T>,
  tokens: AuthTokens,
  guestId?: string
): NextResponse<T> {
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

export function clearSessionCookies<T>(
  response: NextResponse<T>
): NextResponse<T> {
  for (const name of [
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    GUEST_ID_COOKIE,
    CART_ID_COOKIE,
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

export function getCartId(request: Request): string | null {
  return getCookieFromRequest(request, CART_ID_COOKIE);
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
