/**
 * Magento 购物车操作（需要认证）
 * 所有请求都需要携带 accessToken
 */

import { magentoClient } from './client';
import type {
  AddCartItemParams,
  CartItem,
  CartItemsResponse,
  CartRedirectResponse,
} from './types';

/** 添加商品到购物车 */
export function addCartItem(
  params: AddCartItemParams,
  accessToken: string
): Promise<CartItem> {
  return magentoClient.post<CartItem>('/api/cart/items/add', params, {
    accessToken,
  });
}

/** 获取购物车商品列表 */
export async function getCartItems(accessToken: string): Promise<CartItem[]> {
  const res = await magentoClient.get<CartItemsResponse>(
    '/api/cart/items?storeId=1',
    { accessToken }
  );
  return res.items ?? [];
}

/** 删除购物车中的单个商品 */
export function deleteCartItem(
  itemId: number,
  accessToken: string
): Promise<unknown> {
  return magentoClient.delete(`/api/cart/items/${itemId}`, { accessToken });
}

/** 清空购物车 */
export function clearCart(accessToken: string): Promise<unknown> {
  return magentoClient.delete('/api/cart/clear', { accessToken });
}

/** 更新购物车商品数量 */
export function updateCartItemQty(
  itemId: number,
  qty: number,
  accessToken: string
): Promise<CartItem> {
  return magentoClient.put<CartItem>(
    `/api/cart/items/${itemId}`,
    { qty },
    { accessToken }
  );
}

/** 生成购物车跳转链接（有效期 10 分钟，自动登录 Magento 并跳转结账页） */
export function getCartRedirectLink(
  accessToken: string
): Promise<CartRedirectResponse> {
  return magentoClient.post<CartRedirectResponse>(
    '/api/cart/redirect-link',
    { storeId: 1 },
    { accessToken }
  );
}
