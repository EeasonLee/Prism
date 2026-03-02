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

/** 创建购物车（同时在 Magento 中创建/绑定客户账号） */
export function createCart(accessToken: string): Promise<unknown> {
  return magentoClient.post('/api/cart/create', undefined, {
    accessToken,
  });
}

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
