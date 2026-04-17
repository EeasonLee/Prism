/**
 * Magento 购物车操作（通过 BFF /api/cart/* 路由，Cookie 自动传递）
 */

import type {
  AddCartItemParams,
  CartItem,
  CartItemsResponse,
  CartMoney,
  CartRedirectResponse,
} from './types';

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
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new CartRequestError(
      res.status,
      json?.error?.message ?? json?.message ?? `Cart error: ${res.status}`
    );
  }

  return json as T;
}

async function recoverCartSession(): Promise<boolean> {
  try {
    const sessionRes = await fetch('/api/v1/auth/session', {
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
    const guestRes = await fetch('/api/v1/auth/guest', {
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
  return withCartAuthRecovery(
    () =>
      cartFetch<CartItem>('/api/v1/cart/items/add', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    { preflightRefresh: true }
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
