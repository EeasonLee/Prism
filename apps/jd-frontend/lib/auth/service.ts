import { NextResponse } from 'next/server';
import { magentoAuthProvider } from '@/lib/magento/auth';
import { MagentoApiError, isMagentoApiError } from '@/lib/api/magento/client';
import { verifyTurnstileToken } from '@/lib/cloudflare-turnstile';
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
  turnstile_token?: string;
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
  const body = (await request.json()) as AuthPayload;
  const guestId = getGuestId(request);
  let data;
  try {
    data = await magentoAuthProvider.login({
      email: body.email,
      password: body.password,
      guestId: guestId ?? undefined,
    });
  } catch (error) {
    if (isMagentoApiError(error) && error.status === 401) {
      throw new MagentoApiError(
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        401
      );
    }
    throw error;
  }

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
  const body = (await request.json()) as AuthPayload;
  const guestId = getGuestId(request);

  // Verify Cloudflare Turnstile token
  const turnstileResult = await verifyTurnstileToken(body.turnstile_token ?? '');
  if (!turnstileResult.success) {
    return NextResponse.json(
      {
        error: {
          message: turnstileResult.error ?? 'Captcha verification failed',
          code: 'TURNSTILE_FAILED',
        },
      },
      { status: 400 }
    );
  }

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

  const localTokens = await renewSessionTokensFromRefreshToken(refreshToken);
  const response = NextResponse.json({ success: true });
  setSessionCookies(response, localTokens);

  return response;
}

export async function logout(request: Request): Promise<NextResponse> {
  const accessToken = getAccessToken(request);

  if (accessToken) {
    const resolvedAccessToken = extractWrappedMagentoAccessToken(accessToken);

    await magentoAuthProvider.logout(resolvedAccessToken).catch(() => {
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
