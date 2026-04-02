/**
 * 认证相关 API（通过 BFF /api/auth/* 路由，不直连 SSO 服务）
 */

import type { AuthResponse, GuestAuthResponse } from './types';

async function authFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json?.error?.message ?? json?.message ?? `Auth error: ${res.status}`
    );
  }

  return json as T;
}

export interface LoginParams {
  email: string;
  password: string;
  guestSsoUserId?: string;
  storeId?: number;
}

export function login(params: LoginParams): Promise<AuthResponse> {
  const { email, password, guestSsoUserId, storeId } = params;
  return authFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      ...(guestSsoUserId ? { guestSsoUserId } : {}),
      ...(storeId != null ? { storeId } : {}),
    }),
  });
}

export interface RegisterParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  guestSsoUserId?: string;
  storeId?: number;
}

export function register(params: RegisterParams): Promise<AuthResponse> {
  const { email, password, firstName, lastName, guestSsoUserId, storeId } =
    params;
  return authFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      ...(guestSsoUserId ? { guestSsoUserId } : {}),
      ...(storeId != null ? { storeId } : {}),
    }),
  });
}

export function logout(accessToken: string): Promise<void> {
  return authFetch<void>('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function refreshToken(token: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token }),
  });
}

export function guestLogin(): Promise<GuestAuthResponse> {
  return authFetch<GuestAuthResponse>('/api/auth/guest', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
