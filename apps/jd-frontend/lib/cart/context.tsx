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
import type { AddCartItemParams, CartItem } from '../api/magento/types';
import { useAuth } from '../auth/context';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  getQtyBySku: (sku: string) => number;
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
  const { hasSession, isAuthenticated, refreshSession } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const prevAuthStateRef = useRef<{
    hasSession: boolean | null;
    isAuthenticated: boolean | null;
  }>({
    hasSession: null,
    isAuthenticated: null,
  });
  const syncRequestIdRef = useRef(0);
  const initialSyncDoneRef = useRef(false);
  const guestSessionPromiseRef = useRef<Promise<void> | null>(null);

  const syncCart = useCallback(async () => {
    const requestId = ++syncRequestIdRef.current;
    try {
      const nextItems = await getCartItems();
      if (requestId === syncRequestIdRef.current) {
        setItems(nextItems);
      }
    } catch (error) {
      // 短暂失败时保留旧值，避免角标抖动；仅在身份迁移时统一清零
      console.warn('[cart] syncCart failed:', error);
    }
  }, []);

  // 身份状态迁移：最多触发一次同步，避免重复请求
  useEffect(() => {
    const prev = prevAuthStateRef.current;
    const initialized =
      prev.hasSession !== null && prev.isAuthenticated !== null;

    const sessionBecameAvailable =
      initialized && !prev.hasSession && hasSession;
    const justLoggedIn =
      initialized &&
      !prev.isAuthenticated &&
      isAuthenticated &&
      hasSession &&
      !sessionBecameAvailable;
    const justLoggedOut =
      initialized && prev.isAuthenticated && !isAuthenticated;
    const sessionLost = initialized && prev.hasSession && !hasSession;

    if (justLoggedOut || sessionLost) {
      setItems([]);
      setIsCartOpen(false);
    }

    if (sessionBecameAvailable || justLoggedIn) {
      void syncCart();
    }
    if (!initialized && hasSession && !initialSyncDoneRef.current) {
      initialSyncDoneRef.current = true;
      void syncCart();
    }

    prevAuthStateRef.current = { hasSession, isAuthenticated };
  }, [hasSession, isAuthenticated, syncCart]);

  const addToCart = useCallback(
    async (params: AddCartItemParams) => {
      if (!hasSession) {
        if (!guestSessionPromiseRef.current) {
          guestSessionPromiseRef.current = (async () => {
            const res = await fetch('/api/v1/auth/guest', {
              method: 'POST',
              credentials: 'include',
            });
            if (!res.ok) {
              throw new Error('No active session, please try again.');
            }

            // guest session 创建成功后，刷新 auth 状态
            await refreshSession();
          })().finally(() => {
            guestSessionPromiseRef.current = null;
          });
        }

        await guestSessionPromiseRef.current;
      }
      await addCartItem(params);
      await syncCart();
    },
    [hasSession, refreshSession, syncCart]
  );

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items]
  );
  const getQtyBySku = useCallback(
    (sku: string) =>
      items.reduce((sum, item) => (item.sku === sku ? sum + item.qty : sum), 0),
    [items]
  );

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
      if (!hasSession) {
        throw new Error('No active session.');
      }
      if (qty < 1) {
        throw new Error('Quantity must be at least 1.');
      }
      await updateCartItemQtyApi(itemId, qty);
      await syncCart();
    },
    [hasSession, syncCart]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      getQtyBySku,
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
      items,
      itemCount,
      getQtyBySku,
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
