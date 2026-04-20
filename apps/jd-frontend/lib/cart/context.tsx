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
  removeFromCart: (itemId: string) => Promise<void>;
  /** 清空购物车 */
  clearCart: () => Promise<void>;
  /** 更新购物车商品数量 */
  updateItemQty: (itemId: string, qty: number) => Promise<void>;
  /** 重新从服务器同步购物车数量 */
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { hasSession, isAuthenticated } = useAuth();
  const [itemCount, setItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const prevSessionRef = useRef<boolean>(false);
  const prevAuthenticatedRef = useRef<boolean>(false);

  const syncCart = useCallback(async () => {
    try {
      const items = await getCartItems();
      const total = Array.isArray(items)
        ? items.reduce((sum, item) => sum + item.qty, 0)
        : 0;
      setItemCount(total);
    } catch {
      // 购物车不存在或服务异常时，避免角标卡在旧值
      setItemCount(0);
    }
  }, []);

  // session 变化时同步购物车
  useEffect(() => {
    if (hasSession === prevSessionRef.current) return;

    // 身份切换时重置购物车数量
    if (
      prevSessionRef.current !== false &&
      hasSession !== prevSessionRef.current
    ) {
      setItemCount(0);
    }
    prevSessionRef.current = hasSession;

    if (hasSession) {
      syncCart().catch(() => void 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSession]);

  // 登录/登出后 isAuthenticated 变化时同步购物车
  useEffect(() => {
    const wasAuthenticated = prevAuthenticatedRef.current;
    prevAuthenticatedRef.current = isAuthenticated;

    if (wasAuthenticated && !isAuthenticated && hasSession) {
      // 登出：游客 session 仍在，重置角标并同步
      setItemCount(0);
      void syncCart();
    }

    if (!wasAuthenticated && isAuthenticated && hasSession) {
      // 登录成功：购物车合并后需要立即刷新角标
      void syncCart();
    }
  }, [hasSession, isAuthenticated, syncCart]);

  // 从外部页面（如 Magento checkout）返回时重新同步角标
  useEffect(() => {
    if (!hasSession) {
      return;
    }

    const handleFocus = () => {
      void syncCart();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncCart();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasSession, syncCart]);

  const addToCart = useCallback(
    async (params: AddCartItemParams) => {
      if (!hasSession) {
        try {
          const res = await fetch('/api/v1/auth/guest', {
            method: 'POST',
            credentials: 'include',
          });
          if (!res.ok) {
            throw new Error('No active session, please try again.');
          }
        } catch {
          throw new Error('No active session, please try again.');
        }
      }
      await addCartItem(params);
      await syncCart();
    },
    [hasSession, syncCart]
  );

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const removeFromCart = useCallback(
    async (itemId: string) => {
      if (!hasSession) return;
      await deleteCartItemApi(itemId);
      await syncCart();
    },
    [hasSession, syncCart]
  );

  const clearCart = useCallback(async () => {
    if (!hasSession) return;
    await clearCartApi();
    await syncCart();
  }, [hasSession, syncCart]);

  const updateItemQty = useCallback(
    async (itemId: string, qty: number) => {
      if (!hasSession || qty < 1) return;
      await updateCartItemQtyApi(itemId, qty);
      await syncCart();
    },
    [hasSession, syncCart]
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
