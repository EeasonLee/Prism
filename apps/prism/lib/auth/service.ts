import { NextResponse } from 'next/server';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import type { AuthResponse, GuestAuthResponse } from '@/lib/api/magento/types';
import { env } from '@/lib/env';
import { magentoAuthProvider } from '@/lib/magento/auth';
import {
  clearSessionCookies,
  getAccessToken,
  getGuestId,
  getRefreshToken,
  setSessionCookies,
} from './cookies';
import {
  extractWrappedMagentoAccessToken,
  issueCustomerSessionTokens,
  issueGuestSessionTokens,
  renewSessionTokensFromRefreshToken,
} from './session-tokens';

interface AuthPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

async function handleAuthMutation(
  request: Request,
  path: '/api/auth/login' | '/api/auth/register'
): Promise<NextResponse> {
  const body = (await request.json()) as AuthPayload;
  const guestId = getGuestId(request);

  const data = await magentoServerFetch<AuthResponse>(path, {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      ...(guestId ? { guestSsoUserId: guestId } : {}),
      storeId: 1,
    }),
  });

  const response = NextResponse.json({
    user: data.user,
    cartMergeStatus: data.cartMergeStatus,
  });

  setSessionCookies(response, data.tokens);
  response.cookies.delete('guest_id');

  return response;
}

export function createAuthErrorResponse(
  error: unknown,
  fallbackMessage: string,
  status = 500
): NextResponse {
  const errorWithStatus = error as { status?: unknown; code?: unknown } | null;
  const resolvedStatus =
    typeof errorWithStatus?.status === 'number'
      ? errorWithStatus.status
      : status;
  const resolvedCode =
    typeof errorWithStatus?.code === 'string'
      ? errorWithStatus.code
      : 'AUTH_ERROR';

  return NextResponse.json(
    {
      error: {
        message: error instanceof Error ? error.message : fallbackMessage,
        code: resolvedCode,
      },
    },
    { status: resolvedStatus }
  );
}

export async function login(request: Request): Promise<NextResponse> {
  if (!env.USE_LOCAL_AUTH) {
    return handleAuthMutation(request, '/api/auth/login');
  }

  const body = (await request.json()) as AuthPayload;
  const guestId = getGuestId(request);
  const data = await magentoAuthProvider.login({
    email: body.email,
    password: body.password,
    guestId: guestId ?? undefined,
  });

  const localTokens = issueCustomerSessionTokens({
    customerId: data.user.id,
    customerEmail: data.user.email,
    magentoAccessToken: data.magentoAccessToken,
    magentoRefreshToken: data.magentoRefreshToken,
    guestId: data.guestId,
  });

  const response = NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      username: data.user.email,
      first_name: data.user.firstName ?? '',
      last_name: data.user.lastName ?? '',
      email_verified: true,
      active: true,
      role: 'customer',
      created_at: '',
      updated_at: '',
      last_login_at: null,
    },
    cartMergeStatus: data.cartMergeStatus,
  });

  setSessionCookies(response, localTokens);
  response.cookies.delete('guest_id');

  return response;
}

export async function register(request: Request): Promise<NextResponse> {
  if (!env.USE_LOCAL_AUTH) {
    return handleAuthMutation(request, '/api/auth/register');
  }

  const body = (await request.json()) as AuthPayload;
  const guestId = getGuestId(request);
  const data = await magentoAuthProvider.register({
    email: body.email,
    password: body.password,
    firstName: body.first_name,
    lastName: body.last_name,
    guestId: guestId ?? undefined,
  });

  const localTokens = issueCustomerSessionTokens({
    customerId: data.user.id,
    customerEmail: data.user.email,
    magentoAccessToken: data.magentoAccessToken,
    magentoRefreshToken: data.magentoRefreshToken,
    guestId: data.guestId,
  });

  const response = NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      username: data.user.email,
      first_name: data.user.firstName ?? '',
      last_name: data.user.lastName ?? '',
      email_verified: true,
      active: true,
      role: 'customer',
      created_at: '',
      updated_at: '',
      last_login_at: null,
    },
    cartMergeStatus: data.cartMergeStatus,
  });

  setSessionCookies(response, localTokens);
  response.cookies.delete('guest_id');

  return response;
}

export async function createGuestSession(): Promise<NextResponse> {
  const response = NextResponse.json({ hasSession: true });

  if (!env.USE_LOCAL_AUTH) {
    const data = await magentoServerFetch<GuestAuthResponse>(
      '/api/auth/guest',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    setSessionCookies(response, data.tokens, data.guest_id);
    return response;
  }

  const data = await magentoAuthProvider.createGuestSession();
  const localTokens = issueGuestSessionTokens({
    guestId: data.guestId,
    magentoAccessToken: data.magentoAccessToken,
    magentoRefreshToken: data.magentoRefreshToken,
  });

  setSessionCookies(response, localTokens, data.guestId);

  return response;
}

export async function refreshSession(request: Request): Promise<NextResponse> {
  const refreshToken = getRefreshToken(request);

  if (!refreshToken) {
    return NextResponse.json(
      { error: { message: 'No refresh token' } },
      { status: 401 }
    );
  }

  if (!env.USE_LOCAL_AUTH) {
    const data = await magentoServerFetch<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    const response = NextResponse.json({ success: true });
    setSessionCookies(response, data.tokens);

    return response;
  }

  const localTokens = await renewSessionTokensFromRefreshToken(refreshToken);
  const response = NextResponse.json({ success: true });
  setSessionCookies(response, localTokens);

  return response;
}

export async function logout(request: Request): Promise<NextResponse> {
  const accessToken = getAccessToken(request);

  if (accessToken) {
    const resolvedAccessToken = env.USE_LOCAL_AUTH
      ? extractWrappedMagentoAccessToken(accessToken)
      : accessToken;

    const logoutRequest = env.USE_LOCAL_AUTH
      ? magentoAuthProvider.logout(resolvedAccessToken)
      : magentoServerFetch('/api/auth/logout', {
          method: 'POST',
          accessToken: resolvedAccessToken,
        });

    await logoutRequest.catch(() => {
      /* 失败也继续 */
    });
  }

  const guestResponse = await createGuestSession();
  // 登出后清除旧的 cart_id，避免新 guest session 误用旧 cart
  guestResponse.cookies.set('magento_cart_id', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return guestResponse;
}

export function clearSessionOnError(
  error: unknown,
  fallbackMessage: string
): NextResponse {
  const response = createAuthErrorResponse(error, fallbackMessage);
  clearSessionCookies(response);
  return response;
}
