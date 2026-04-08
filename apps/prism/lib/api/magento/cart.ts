/**
 * Magento 购物车操作（通过 BFF /api/cart/* 路由，Cookie 自动传递）
 */

import type {
  AddCartItemParams,
  CartItem,
  CartItemsResponse,
  CartRedirectResponse,
} from './types';

class CartRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'CartRequestError';
  }
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

export async function addCartItem(
  params: AddCartItemParams
): Promise<CartItem> {
  try {
    return await cartFetch<CartItem>('/api/cart/items/add', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } catch (error) {
    const isUnauthorized =
      error instanceof CartRequestError &&
      error.status === 401 &&
      error.message === 'Unauthorized';

    if (!isUnauthorized) {
      throw error;
    }

    const recovered = await recoverCartSession();
    if (!recovered) {
      throw error;
    }

    return cartFetch<CartItem>('/api/cart/items/add', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export async function getCartItems(): Promise<CartItem[]> {
  const res = await cartFetch<CartItemsResponse>('/api/cart/items');
  return res.items ?? [];
}

export function deleteCartItem(itemId: number): Promise<unknown> {
  return cartFetch(`/api/cart/items/${itemId}`, {
    method: 'DELETE',
  });
}

export function clearCart(): Promise<unknown> {
  return cartFetch('/api/cart/clear', {
    method: 'DELETE',
  });
}

export function updateCartItemQty(
  itemId: number,
  qty: number
): Promise<CartItem> {
  return cartFetch<CartItem>(`/api/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ qty }),
  });
}

export function getCartRedirectLink(): Promise<CartRedirectResponse> {
  return cartFetch<CartRedirectResponse>('/api/cart/redirect-link', {
    method: 'POST',
  });
}

export function getCheckoutRedirectLink(): Promise<CartRedirectResponse> {
  return cartFetch<CartRedirectResponse>('/api/cart/checkout-redirect-link', {
    method: 'POST',
  });
}
