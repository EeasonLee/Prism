'use client';

import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getCartItems, getCartRedirectLink } from '../../lib/api/magento/cart';
import type { CartItem } from '../../lib/api/magento/types';
import { useAuth } from '../../lib/auth/context';
import { useCart } from '../../lib/cart/context';
import { LoginModal } from './LoginModal';

export function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    itemCount,
    removeFromCart,
    clearCart,
    updateItemQty,
  } = useCart();
  const { accessToken, isGuest } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [mutatingItemId, setMutatingItemId] = useState<number | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 打开抽屉时加载购物车详情
  useEffect(() => {
    if (!isCartOpen || !accessToken) return;
    setLoadingItems(true);
    setServiceError(null);
    getCartItems(accessToken)
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(err => {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('unavailable')) {
          setServiceError(
            'Shop service is temporarily unavailable, please try again later.'
          );
        }
      })
      .finally(() => setLoadingItems(false));
  }, [isCartOpen, accessToken, itemCount]);

  const handleCheckout = useCallback(async () => {
    if (!accessToken) return;

    // 游客直接弹出登录引导，无需请求接口
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }

    setCheckoutLoading(true);
    setServiceError(null);
    try {
      const { redirect_url } = await getCartRedirectLink(accessToken);
      window.open(redirect_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // 服务端拦截游客结账的兜底处理
      if (msg.includes('GUEST_CHECKOUT_NOT_ALLOWED') || msg.includes('guest')) {
        setShowLoginModal(true);
      } else {
        setServiceError(
          msg.includes('unavailable')
            ? 'Shop service is temporarily unavailable, please try again later.'
            : 'Failed to generate checkout link. Please try again.'
        );
      }
    } finally {
      setCheckoutLoading(false);
    }
  }, [accessToken, isGuest]);

  const handleRemoveItem = useCallback(
    async (itemId: number) => {
      setMutatingItemId(itemId);
      setServiceError(null);
      try {
        await removeFromCart(itemId);
        setItems(prev => prev.filter(i => i.item_id !== itemId));
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        setServiceError(
          msg.includes('unavailable')
            ? 'Shop service is temporarily unavailable, please try again later.'
            : 'Failed to remove item. Please try again.'
        );
      } finally {
        setMutatingItemId(null);
      }
    },
    [removeFromCart]
  );

  const handleClearCart = useCallback(async () => {
    setClearLoading(true);
    setServiceError(null);
    try {
      await clearCart();
      setItems([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setServiceError(
        msg.includes('unavailable')
          ? 'Shop service is temporarily unavailable, please try again later.'
          : 'Failed to clear cart. Please try again.'
      );
    } finally {
      setClearLoading(false);
    }
  }, [clearCart]);

  const handleUpdateQty = useCallback(
    async (itemId: number, newQty: number) => {
      if (newQty < 1) return;
      setMutatingItemId(itemId);
      setServiceError(null);
      try {
        await updateItemQty(itemId, newQty);
        setItems(prev =>
          prev.map(i => (i.item_id === itemId ? { ...i, qty: newQty } : i))
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        setServiceError(
          msg.includes('unavailable')
            ? 'Shop service is temporarily unavailable, please try again later.'
            : 'Failed to update quantity. Please try again.'
        );
      } finally {
        setMutatingItemId(null);
      }
    },
    [updateItemQty]
  );

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const hasItems = items.length > 0;

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          aria-hidden="true"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <aside
        id="cart-drawer"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-background shadow-2xl transition-transform duration-300 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <ShoppingCart className="h-5 w-5" />
            Cart
            {itemCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">
                {itemCount}
              </span>
            )}
          </h2>
          <button
            type="button"
            aria-label="Close cart"
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loadingItems && (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div
                  key={n}
                  className="h-16 animate-pulse rounded-lg bg-surface"
                />
              ))}
            </div>
          )}

          {!loadingItems && !hasItems && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="mb-3 h-10 w-10 text-ink-muted/40" />
              <p className="text-sm font-medium text-ink-muted">
                Your cart is empty
              </p>
            </div>
          )}

          {!loadingItems && hasItems && (
            <ul className="space-y-3">
              {items.map(item => (
                <li
                  key={item.item_id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      SKU: {item.sku}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          handleUpdateQty(item.item_id, item.qty - 1)
                        }
                        disabled={
                          mutatingItemId === item.item_id || item.qty <= 1
                        }
                        className="flex h-7 w-7 items-center justify-center rounded border border-border text-ink-muted transition hover:bg-surface hover:text-ink disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-6 text-center text-sm text-ink">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          handleUpdateQty(item.item_id, item.qty + 1)
                        }
                        disabled={mutatingItemId === item.item_id}
                        className="flex h-7 w-7 items-center justify-center rounded border border-border text-ink-muted transition hover:bg-surface hover:text-ink disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-sm font-semibold text-ink">
                      ${(item.price * item.qty).toFixed(2)}
                    </p>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => handleRemoveItem(item.item_id)}
                      disabled={mutatingItemId === item.item_id}
                      className="flex h-8 w-8 items-center justify-center rounded text-ink-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {serviceError && (
            <p role="alert" className="mt-4 text-center text-xs text-red-500">
              {serviceError}
            </p>
          )}
        </div>

        {hasItems && (
          <div className="space-y-3 border-t border-border px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-semibold text-ink">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            {isGuest && (
              <p className="text-center text-xs text-ink-muted">
                Sign in or create an account to checkout.
              </p>
            )}
            <button
              type="button"
              onClick={handleClearCart}
              disabled={clearLoading}
              className="w-full py-2 text-sm text-ink-muted transition hover:text-ink disabled:opacity-50"
            >
              {clearLoading ? 'Clearing…' : 'Clear cart'}
            </button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="btn-primary w-full py-3 text-sm font-semibold disabled:opacity-60"
            >
              {checkoutLoading ? 'Redirecting…' : 'Checkout'}
            </button>
          </div>
        )}
      </aside>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
        defaultTab="register"
      />
    </>
  );
}
