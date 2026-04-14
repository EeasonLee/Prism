import { NextResponse } from 'next/server';
import { MagentoApiError } from '@/lib/api/magento/client';
import type { AuthResponse, AuthTokens } from '@/lib/api/magento/types';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import { withRefreshLock } from '@/lib/api/bff/refresh-lock';
import { env } from '@/lib/env';
import {
  extractWrappedMagentoAccessToken,
  renewSessionTokensFromRefreshToken,
} from './session-tokens';
import { clearSession } from './clearSession';
import { getAccessToken, getRefreshToken } from './cookies';
import { setSession } from './setSession';

async function refreshViaMagento(
  refreshToken: string
): Promise<AuthTokens | null> {
  try {
    if (env.USE_LOCAL_AUTH) {
      return await renewSessionTokensFromRefreshToken(refreshToken);
    }

    const data = await magentoServerFetch<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    return data.tokens;
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
    if (error instanceof MagentoApiError && error.status === 401) {
      const response = unauthorizedResponse('Session expired');
      return clearSession(response);
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
      return clearSession(response);
    }

    try {
      const retryAccessToken = env.USE_LOCAL_AUTH
        ? extractWrappedMagentoAccessToken(newTokens.accessToken)
        : newTokens.accessToken;
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
  try {
    resolvedAccessToken = env.USE_LOCAL_AUTH
      ? extractWrappedMagentoAccessToken(accessToken)
      : accessToken;
  } catch {
    // Local token expired, try refresh
    const refreshToken = getRefreshToken(request);

    if (!refreshToken) {
      const response = NextResponse.json(
        { error: { message: 'Session expired' } },
        { status: 401 }
      );
      return clearSession(response);
    }

    const newTokens = await withRefreshLock(() =>
      refreshViaMagento(refreshToken)
    );

    if (!newTokens) {
      const response = NextResponse.json(
        { error: { message: 'Session expired' } },
        { status: 401 }
      );
      return clearSession(response);
    }

    try {
      resolvedAccessToken = env.USE_LOCAL_AUTH
        ? extractWrappedMagentoAccessToken(newTokens.accessToken)
        : newTokens.accessToken;
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
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof MagentoApiError && error.status === 401) {
      const refreshToken = getRefreshToken(request);

      if (!refreshToken) {
        const response = NextResponse.json(
          { error: { message: 'Session expired' } },
          { status: 401 }
        );

        return clearSession(response);
      }

      const newTokens = await withRefreshLock(() =>
        refreshViaMagento(refreshToken)
      );

      if (!newTokens) {
        const response = NextResponse.json(
          { error: { message: 'Session expired' } },
          { status: 401 }
        );

        return clearSession(response);
      }

      try {
        const retryAccessToken = env.USE_LOCAL_AUTH
          ? extractWrappedMagentoAccessToken(newTokens.accessToken)
          : newTokens.accessToken;
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
      { status: error instanceof MagentoApiError ? error.status : 500 }
    );
  }
}
