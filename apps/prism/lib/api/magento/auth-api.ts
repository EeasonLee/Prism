/**
 * 认证相关 API（直接请求 SSO 服务，不经过 /magento/* 代理）
 * /auth/* 接口直接返回业务数据，不使用 { success, data, error } 包装
 */

import { env } from '../../env';
import type { AuthResponse, GuestAuthResponse } from './types';

function getBaseUrl(): string {
  // 浏览器端走 Next.js 代理，避免跨域；服务端直连
  if (typeof window !== 'undefined' && env.NEXT_PUBLIC_USE_API_PROXY) {
    return '/magento-proxy';
  }
  const url = env.NEXT_PUBLIC_MAGENTO_API_URL;
  if (!url) throw new Error('NEXT_PUBLIC_MAGENTO_API_URL is not configured');
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function authFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, {
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

export function login(email: string, password: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
    }),
  });
}

export function logout(accessToken: string): Promise<void> {
  return authFetch<void>('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function refreshToken(refreshToken: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function guestLogin(): Promise<GuestAuthResponse> {
  return authFetch<GuestAuthResponse>('/api/auth/guest', {
    method: 'POST',
  });
}
