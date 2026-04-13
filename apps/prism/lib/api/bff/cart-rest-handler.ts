/**
 * Cart Request Handler with cart_id cookie management (REST version)
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { getCartId, CART_ID_COOKIE } from '@/lib/auth/cookies';
import { extractLocalAccessTokenPayload } from '@/lib/auth/session-tokens';
import { env } from '@/lib/env';
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
  if (!env.USE_LOCAL_AUTH) {
    return false;
  }
  try {
    const payload = extractLocalAccessTokenPayload(accessToken);
    return payload.type === 'guest';
  } catch {
    return false;
  }
}

/**
 * 确保 guest 有 cart_id，如果没有则创建
 */
async function ensureGuestCartId(
  request: Request,
  magentoAccessToken: string
): Promise<string> {
  const existingCartId = getCartId(request);
  if (existingCartId) {
    return existingCartId;
  }

  // 创建新的 guest cart
  return await cartRestService.createGuestCart(magentoAccessToken);
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
    const accessToken = request.headers
      .get('cookie')
      ?.match(/access_token=([^;]+)/)?.[1];
    const isGuest = accessToken ? isGuestSession(accessToken) : false;

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
