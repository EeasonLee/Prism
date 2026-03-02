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
import { addCartItem, createCart, getCartItems } from '../api/magento/cart';
import type { AddCartItemParams } from '../api/magento/types';
import { useAuth } from '../auth/context';

const CART_CREATED_KEY = 'magento_cart_created';

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
  /** 加购：自动处理「创建购物车 → 加购」流程，游客和注册用户均可使用 */
  addToCart: (params: AddCartItemParams) => Promise<void>;
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

    // 身份切换时重置购物车创建标记
    if (prevTokenRef.current !== null && accessToken !== prevTokenRef.current) {
      localStorage.removeItem(CART_CREATED_KEY);
      setItemCount(0);
    }
    prevTokenRef.current = accessToken;

    if (accessToken) {
      syncCart().catch(() => void 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const ensureCart = useCallback(async (): Promise<void> => {
    if (!accessToken) return;
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
      if (!accessToken) throw new Error('No active session, please try again.');
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
