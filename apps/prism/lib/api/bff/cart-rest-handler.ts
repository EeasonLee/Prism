/**
 * Cart Request Handler with cart_id cookie management (REST version)
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { getCartId, getGuestId, CART_ID_COOKIE } from '@/lib/auth/cookies';
import {
  extractLocalAccessTokenPayload,
  validateRefreshToken,
} from '@/lib/auth/session-tokens';
import * as cartRestService from '@/lib/magento/cart-rest.service';

const CART_ID_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

const BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

/**
 * 判断当前用户是否是 guest
 */
function isGuestSession(accessToken: string): boolean {
  try {
    const payload = extractLocalAccessTokenPayload(accessToken);
    return payload.type === 'guest';
  } catch {
    return false;
  }
}

/**
 * 判定当前请求是否应按 guest 处理：
 * 1) 本地 access_token 可解析时，以 token 类型为准；
 * 2) token 不可用（如过期）时，回退 guest_id cookie，避免误走 customer 分支。
 */
function resolveIsGuestSession(request: Request): boolean {
  const cookies = request.headers.get('cookie') ?? '';
  const accessToken = cookies.match(/access_token=([^;]+)/)?.[1];

  if (accessToken) {
    try {
      return isGuestSession(accessToken);
    } catch {
      // token 失效时回退 refresh_token 判定
    }
  }

  const refreshToken = cookies.match(/refresh_token=([^;]+)/)?.[1];
  if (refreshToken) {
    try {
      const payload = validateRefreshToken(refreshToken);
      return payload.type === 'guest';
    } catch {
      // refresh token 也无效时回退 guest_id
    }
  }

  return Boolean(getGuestId(request));
}

/**
 * 确保 guest 有 cart_id，如果没有则创建
 */
async function ensureGuestCartId(
  request: Request,
  magentoAccessToken: string
): Promise<string> {
  const existingCartId = getCartId(request) ?? undefined;
  return await cartRestService.getGuestCartId(
    magentoAccessToken,
    existingCartId
  );
}

export async function authenticatedCartRequest<T>(
  request: Request,
  handler: (
    magentoAccessToken: string,
    cartId: string | null,
    isGuest: boolean
  ) => Promise<T>
): Promise<NextResponse> {
  const response = await requireAuth(request, async magentoAccessToken => {
    const isGuest = resolveIsGuestSession(request);

    let cartId: string | null = null;

    if (isGuest) {
      cartId = await ensureGuestCartId(request, magentoAccessToken);
    }

    return handler(magentoAccessToken, cartId, isGuest);
  });

  // 如果 response body 包含 cart_id，设置 cookie
  if (response.headers.get('content-type')?.includes('json')) {
    const clonedResponse = response.clone();
    try {
      const data = (await clonedResponse.json()) as Record<string, unknown>;
      if (data.cart_id && typeof data.cart_id === 'string') {
        const newResponse = NextResponse.json(data, {
          status: response.status,
        });

        // 复制所有 cookies
        for (const cookie of response.cookies.getAll()) {
          newResponse.cookies.set(cookie.name, cookie.value);
        }

        // 设置 cart_id cookie
        newResponse.cookies.set(CART_ID_COOKIE, data.cart_id, {
          ...BASE_OPTIONS,
          maxAge: CART_ID_MAX_AGE,
        });

        return newResponse;
      }
    } catch {
      // JSON 解析失败，返回原 response
    }
  }

  return response;
}
