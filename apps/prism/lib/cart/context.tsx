'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addCartItem,
  clearCart as clearCartApi,
  deleteCartItem as deleteCartItemApi,
  getCartItems,
  updateCartItemQty as updateCartItemQtyApi,
} from '../api/magento/cart';
import type { AddCartItemParams } from '../api/magento/types';
import { useAuth } from '../auth/context';

export class GuestCheckoutError extends Error {
  readonly code = 'GUEST_CHECKOUT_NOT_ALLOWED';
  constructor(message: string) {
    super(message);
    this.name = 'GuestCheckoutError';
  }
}

interface CartContextValue {
  itemCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** 加购：游客和注册用户均可使用 */
  addToCart: (params: AddCartItemParams) => Promise<void>;
  /** 删除购物车中的单个商品 */
  removeFromCart: (itemId: number) => Promise<void>;
  /** 清空购物车 */
  clearCart: () => Promise<void>;
  /** 更新购物车商品数量 */
  updateItemQty: (itemId: number, qty: number) => Promise<void>;
  /** 重新从服务器同步购物车数量 */
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const [itemCount, setItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  // 记录上一次 token，用于检测身份切换（登录/登出）
  const prevTokenRef = useRef<string | null>(null);

  const syncCart = useCallback(async () => {
    if (!accessToken) return;
    try {
      const items = await getCartItems(accessToken);
      const total = Array.isArray(items)
        ? items.reduce((sum, item) => sum + item.qty, 0)
        : 0;
      setItemCount(total);
    } catch {
      // 购物车不存在或服务异常，静默处理
    }
  }, [accessToken]);

  // token 变化时同步购物车（登录、游客初始化、登出切换）
  useEffect(() => {
    if (accessToken === prevTokenRef.current) return;

    // 身份切换时重置购物车数量
    if (prevTokenRef.current !== null && accessToken !== prevTokenRef.current) {
      setItemCount(0);
    }
    prevTokenRef.current = accessToken;

    if (accessToken) {
      syncCart().catch(() => void 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const addToCart = useCallback(
    async (params: AddCartItemParams) => {
      if (!accessToken) throw new Error('No active session, please try again.');
      await addCartItem(params, accessToken);
      await syncCart();
    },
    [accessToken, syncCart]
  );

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const removeFromCart = useCallback(
    async (itemId: number) => {
      if (!accessToken) return;
      await deleteCartItemApi(itemId, accessToken);
      await syncCart();
    },
    [accessToken, syncCart]
  );

  const clearCart = useCallback(async () => {
    if (!accessToken) return;
    await clearCartApi(accessToken);
    await syncCart();
  }, [accessToken, syncCart]);

  const updateItemQty = useCallback(
    async (itemId: number, qty: number) => {
      if (!accessToken || qty < 1) return;
      await updateCartItemQtyApi(itemId, qty, accessToken);
      await syncCart();
    },
    [accessToken, syncCart]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      itemCount,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      clearCart,
      updateItemQty,
      syncCart,
    }),
    [
      itemCount,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      clearCart,
      updateItemQty,
      syncCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
