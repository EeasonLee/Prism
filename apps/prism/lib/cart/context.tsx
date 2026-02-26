'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { addCartItem, createCart, getCartItems } from '../api/magento/cart';
import type { AddCartItemParams } from '../api/magento/types';
import { useAuth } from '../auth/context';

const CART_CREATED_KEY = 'magento_cart_created';

interface CartContextValue {
  itemCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** 加购：自动处理「创建购物车 → 加购」流程，需要已登录 */
  addToCart: (params: AddCartItemParams) => Promise<void>;
  /** 重新从服务器同步购物车数量 */
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [itemCount, setItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 登录后同步购物车数量
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      syncCart().catch(() => void 0);
    } else {
      setItemCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);

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

  const ensureCart = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
    // 已创建标记
    if (localStorage.getItem(CART_CREATED_KEY) === 'true') return;
    try {
      await createCart(accessToken);
      localStorage.setItem(CART_CREATED_KEY, 'true');
    } catch {
      // 可能已创建，忽略错误
      localStorage.setItem(CART_CREATED_KEY, 'true');
    }
  }, [accessToken]);

  const addToCart = useCallback(
    async (params: AddCartItemParams) => {
      if (!accessToken) throw new Error('Please log in to add items to cart');
      await ensureCart();
      await addCartItem(params, accessToken);
      await syncCart();
    },
    [accessToken, ensureCart, syncCart]
  );

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({ itemCount, isCartOpen, openCart, closeCart, addToCart, syncCart }),
    [itemCount, isCartOpen, openCart, closeCart, addToCart, syncCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
