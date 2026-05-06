/**
 * Magento 购物车操作（通过 BFF /api/cart/* 路由，Cookie 自动传递）
 */

import type {
  AddCartItemParams,
  CartItem,
  CartItemsResponse,
  CartMoney,
  CartRedirectResponse,
} from '@/features/cart/types';

import { bffClient } from '@/core/api/clients/bff';
import { ApiError } from '@/core/api/errors';

export function formatCartMoney(m: CartMoney | null | undefined): string {
  if (!m) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: m.currency,
    }).format(m.value);
  } catch {
    return `${m.currency} ${m.value.toFixed(2)}`;
  }
}

/** 行金额：优先 Magento row_total，否则单价×数量 */
export function formatCartLineTotal(item: CartItem): string {
  const currency = item.currency ?? 'USD';
  const value =
    typeof item.row_total === 'number' ? item.row_total : item.price * item.qty;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

class CartRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'CartRequestError';
  }
}

function isUnauthorizedError(error: unknown): error is CartRequestError {
  return error instanceof CartRequestError && error.status === 401;
}

interface SessionProbeResponse {
  hasSession?: boolean;
  isAuthenticated?: boolean;
  isGuest?: boolean;
}

async function cartFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();

  // Use new pipeline for standard methods
  if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const headers: Record<string, string> = {};
      if (options.headers) {
        for (const [k, v] of new Headers(options.headers).entries()) {
          headers[k] = v;
        }
      }

      const opts = {
        credentials: 'include' as RequestCredentials,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        ...(options.body ? { body: JSON.parse(options.body as string) } : {}),
      };

      const result = await (() => {
        switch (method) {
          case 'GET':
            return bffClient.get<T>(path, opts);
          case 'POST':
            return bffClient.post<T>(path, opts);
          case 'PUT':
            return bffClient.put<T>(path, opts);
          case 'PATCH':
            return bffClient.patch<T>(path, opts);
          case 'DELETE':
            return bffClient.delete<T>(path, opts);
          default:
            throw new Error(`Unknown method: ${method}`);
        }
      })();
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new CartRequestError(error.status, error.message);
      }
      throw new CartRequestError(
        0,
        error instanceof Error ? error.message : 'Network error'
      );
    }
  }

  throw new Error(`Unsupported method: ${method}`);
}

async function recoverCartSession(): Promise<boolean> {
  try {
    const sessionRes = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (sessionRes.ok) {
      const sessionData = (await sessionRes.json()) as SessionProbeResponse;
      // 已登录用户：session 端会尝试 refresh 并回写 cookie，直接认为恢复成功
      if (sessionData.hasSession && sessionData.isAuthenticated) {
        return true;
      }
    }
  } catch {
    // 会话探测失败时，继续尝试 guest 补会话
  }

  try {
    const guestRes = await fetch('/api/auth/guest', {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    return guestRes.ok;
  } catch {
    return false;
  }
}

interface CartAuthStrategy {
  preflightRefresh?: boolean;
}

async function withCartAuthRecovery<T>(
  operation: () => Promise<T>,
  strategy: CartAuthStrategy = {}
): Promise<T> {
  if (strategy.preflightRefresh) {
    // 预刷新：下单前先让服务端尝试 refresh，减少临界点 401 概率
    await recoverCartSession();
  }

  try {
    return await operation();
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }

    const recovered = await recoverCartSession();
    if (!recovered) {
      throw error;
    }

    return operation();
  }
}

export async function addCartItem(
  params: AddCartItemParams
): Promise<CartItem> {
  return withCartAuthRecovery(() =>
    cartFetch<CartItem>('/api/v1/cart/items/add', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  );
}

export async function getCartSnapshot(): Promise<CartItemsResponse> {
  return withCartAuthRecovery(() =>
    cartFetch<CartItemsResponse>('/api/v1/cart/items')
  );
}

export async function getCartItems(): Promise<CartItem[]> {
  const res = await getCartSnapshot();
  return res.items ?? [];
}

export function deleteCartItem(itemId: string): Promise<unknown> {
  return withCartAuthRecovery(() =>
    cartFetch(`/api/v1/cart/items/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    })
  );
}

export function clearCart(): Promise<unknown> {
  return withCartAuthRecovery(() =>
    cartFetch('/api/v1/cart/clear', {
      method: 'DELETE',
    })
  );
}

export function updateCartItemQty(
  itemId: string,
  qty: number
): Promise<CartItem> {
  return withCartAuthRecovery(() =>
    cartFetch<CartItem>(`/api/v1/cart/items/${encodeURIComponent(itemId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ qty }),
    })
  );
}

export function getCartRedirectLink(): Promise<CartRedirectResponse> {
  return withCartAuthRecovery(() =>
    cartFetch<CartRedirectResponse>('/api/v1/cart/redirect-link', {
      method: 'POST',
    })
  );
}

export function getCheckoutRedirectLink(): Promise<CartRedirectResponse> {
  return withCartAuthRecovery(
    () =>
      cartFetch<CartRedirectResponse>('/api/v1/checkout/session', {
        method: 'POST',
      }),
    { preflightRefresh: true }
  );
}

export function applyCoupon(couponCode: string): Promise<CartItemsResponse> {
  return withCartAuthRecovery(() =>
    cartFetch<CartItemsResponse>('/api/v1/cart/coupon/apply', {
      method: 'POST',
      body: JSON.stringify({ couponCode }),
    })
  );
}

export function removeCoupon(): Promise<CartItemsResponse> {
  return withCartAuthRecovery(() =>
    cartFetch<CartItemsResponse>('/api/v1/cart/coupon', {
      method: 'DELETE',
    })
  );
}
