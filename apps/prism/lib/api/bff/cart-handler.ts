/**
 * Cart BFF 统一处理器（服务端专用）
 *
 * 封装 Cookie 读取 → Magento 调用 → 401 刷新重试 → Cookie 写回的完整流程。
 */

import { NextResponse } from 'next/server';
import { MagentoApiError } from '../magento/client';
import type { AuthResponse, AuthTokens } from '../magento/types';
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
} from './cookies';
import { magentoServerFetch } from './magento-server';
import { withRefreshLock } from './refresh-lock';

async function refreshViaMagento(
  refreshToken: string
): Promise<AuthTokens | null> {
  try {
    const data = await magentoServerFetch<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    return data.tokens;
  } catch {
    return null;
  }
}

export async function authenticatedCartRequest<T>(
  request: Request,
  magentoCall: (accessToken: string) => Promise<T>
): Promise<NextResponse> {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json(
      { error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    const data = await magentoCall(accessToken);
    return NextResponse.json(data);
  } catch (error) {
    if (
      error instanceof MagentoApiError &&
      error.code === 'TOKEN_EXPIRED' &&
      error.status === 401
    ) {
      const refreshToken = getRefreshToken(request);
      if (!refreshToken) {
        const res = NextResponse.json(
          { error: { message: 'Session expired' } },
          { status: 401 }
        );
        return clearAuthCookies(res);
      }

      const newTokens = await withRefreshLock(() =>
        refreshViaMagento(refreshToken)
      );

      if (!newTokens) {
        const res = NextResponse.json(
          { error: { message: 'Session expired' } },
          { status: 401 }
        );
        return clearAuthCookies(res);
      }

      try {
        const retryData = await magentoCall(newTokens.accessToken);
        const res = NextResponse.json(retryData);
        return setAuthCookies(res, newTokens);
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
