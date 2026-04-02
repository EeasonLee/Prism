/**
 * Magento 购物车操作（通过 BFF /api/cart/* 路由，Cookie 自动传递）
 */

import type {
  AddCartItemParams,
  CartItem,
  CartItemsResponse,
  CartRedirectResponse,
} from './types';

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
    throw new Error(
      json?.error?.message ?? json?.message ?? `Cart error: ${res.status}`
    );
  }

  return json as T;
}

export function addCartItem(params: AddCartItemParams): Promise<CartItem> {
  return cartFetch<CartItem>('/api/cart/items/add', {
    method: 'POST',
    body: JSON.stringify(params),
  });
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
