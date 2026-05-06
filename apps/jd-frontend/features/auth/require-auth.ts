import { NextResponse } from 'next/server';
import { isApiError } from '@/core/api/errors';
import type { AuthTokens } from '@/features/auth/types';
import { withRefreshLock } from '@/core/api/refresh-lock';
import {
  extractWrappedMagentoAccessToken,
  extractLocalAccessTokenPayload,
  renewSessionTokensFromRefreshToken,
} from './session-tokens';
import {
  clearSessionCookies,
  getAccessToken,
  getRefreshToken,
} from './cookies';
import { setSession } from './set-session';

async function refreshViaMagento(
  refreshToken: string
): Promise<AuthTokens | null> {
  try {
    return await renewSessionTokensFromRefreshToken(refreshToken);
  } catch {
    return null;
  }
}

export async function requireAuth<T>(
  request: Request,
  handler: (accessToken: string) => Promise<T>
): Promise<NextResponse> {
  const unauthorizedResponse = (message: string) =>
    NextResponse.json({ error: { message } }, { status: 401 });

  const asUnauthorizedIfNeeded = (error: unknown): NextResponse | null => {
    if (isApiError(error) && error.status === 401) {
      const response = unauthorizedResponse('Session expired');
      return clearSessionCookies(response);
    }
    return null;
  };

  const accessToken = getAccessToken(request);

  if (!accessToken) {
    const refreshToken = getRefreshToken(request);
    if (!refreshToken) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const newTokens = await withRefreshLock(() =>
      refreshViaMagento(refreshToken)
    );

    if (!newTokens) {
      const response = NextResponse.json(
        { error: { message: 'Session expired' } },
        { status: 401 }
      );
      return clearSessionCookies(response);
    }

    try {
      const retryAccessToken = extractWrappedMagentoAccessToken(
        newTokens.accessToken
      );
      const data = await handler(retryAccessToken);
      const response = NextResponse.json(data);
      return setSession(response, newTokens);
    } catch (retryError) {
      const unauthorized = asUnauthorizedIfNeeded(retryError);
      if (unauthorized) {
        return unauthorized;
      }

      return NextResponse.json(
        {
          error: {
            message:
              retryError instanceof Error
                ? retryError.message
                : 'Request failed',
          },
        },
        { status: 500 }
      );
    }
  }

  let resolvedAccessToken: string;
  let preRefreshedTokens: AuthTokens | null = null;
  try {
    const payload = extractLocalAccessTokenPayload(accessToken);
    const now = Math.floor(Date.now() / 1000);
    const refreshToken = getRefreshToken(request);
    // 临期主动刷新（5 分钟阈值），避免把过期/临期的 local access token 发给 Magento。
    // 本地 auth customer 没有 magentoRefreshToken，但 Magento Customer Token 已延长到 7 天，
    // 因此 proactive refresh 仍然有效：用本地 refresh token 重新签发新的 access token，
    // 包装的是仍然有效的 Magento token。
    if (refreshToken && payload.exp - now < 5 * 60) {
      const newTokens = await withRefreshLock(() =>
        refreshViaMagento(refreshToken)
      );
      if (newTokens) {
        preRefreshedTokens = newTokens;
        resolvedAccessToken = extractWrappedMagentoAccessToken(
          newTokens.accessToken
        );
      } else {
        resolvedAccessToken = payload.magentoAccessToken;
      }
    } else {
      resolvedAccessToken = payload.magentoAccessToken;
    }
  } catch {
    // Local token expired, try refresh
    const refreshToken = getRefreshToken(request);

    if (!refreshToken) {
      const response = NextResponse.json(
        { error: { message: 'Session expired' } },
        { status: 401 }
      );
      return clearSessionCookies(response);
    }

    const newTokens = await withRefreshLock(() =>
      refreshViaMagento(refreshToken)
    );

    if (!newTokens) {
      const response = NextResponse.json(
        { error: { message: 'Session expired' } },
        { status: 401 }
      );
      return clearSessionCookies(response);
    }

    try {
      resolvedAccessToken = extractWrappedMagentoAccessToken(
        newTokens.accessToken
      );
      const data = await handler(resolvedAccessToken);
      const response = NextResponse.json(data);
      return setSession(response, newTokens);
    } catch (retryError) {
      return NextResponse.json(
        {
          error: {
            message:
              retryError instanceof Error
                ? retryError.message
                : 'Request failed',
          },
        },
        { status: 500 }
      );
    }
  }

  try {
    const data = await handler(resolvedAccessToken);
    const response = NextResponse.json(data);
    if (preRefreshedTokens) {
      return setSession(response, preRefreshedTokens);
    }
    return response;
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      const refreshToken = getRefreshToken(request);

      if (!refreshToken) {
        const response = NextResponse.json(
          { error: { message: 'Session expired' } },
          { status: 401 }
        );

        return clearSessionCookies(response);
      }

      const newTokens = await withRefreshLock(() =>
        refreshViaMagento(refreshToken)
      );

      if (!newTokens) {
        const response = NextResponse.json(
          { error: { message: 'Session expired' } },
          { status: 401 }
        );

        return clearSessionCookies(response);
      }

      try {
        const retryAccessToken = extractWrappedMagentoAccessToken(
          newTokens.accessToken
        );
        const retryData = await handler(retryAccessToken);
        const response = NextResponse.json(retryData);
        return setSession(response, newTokens);
      } catch (retryError) {
        const unauthorized = asUnauthorizedIfNeeded(retryError);
        if (unauthorized) {
          return unauthorized;
        }

        return NextResponse.json(
          {
            error: {
              message:
                retryError instanceof Error
                  ? retryError.message
                  : 'Request failed',
            },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Request failed',
        },
      },
      { status: isApiError(error) ? error.status : 500 }
    );
  }
}
