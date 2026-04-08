'use client';

import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCartItems,
  getCheckoutRedirectLink,
} from '../../lib/api/magento/cart';
import type { CartItem } from '../../lib/api/magento/types';
import { useAuth } from '../../lib/auth/context';
import { useCart } from '../../lib/cart/context';
import { LoginModal } from '../components/LoginModal';

export default function CartPage() {
  const { hasSession, isGuest } = useAuth();
  const { removeFromCart, clearCart, updateItemQty } = useCart();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [mutatingItemId, setMutatingItemId] = useState<number | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const loadCartItems = useCallback(async () => {
    if (!hasSession) {
      setItems([]);
      setLoadingItems(false);
      return;
    }

    setLoadingItems(true);
    setServiceError(null);
    try {
      const data = await getCartItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setServiceError(
        msg.includes('unavailable')
          ? 'Shop service is temporarily unavailable, please try again later.'
          : 'Failed to load cart items. Please try again.'
      );
    } finally {
      setLoadingItems(false);
    }
  }, [hasSession]);

  useEffect(() => {
    void loadCartItems();
  }, [loadCartItems]);

  const handleUpdateQty = useCallback(
    async (itemId: number, newQty: number) => {
      if (newQty < 1) return;
      setMutatingItemId(itemId);
      setServiceError(null);
      try {
        await updateItemQty(itemId, newQty);
        setItems(prev =>
          prev.map(item =>
            item.item_id === itemId ? { ...item, qty: newQty } : item
          )
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

  const handleRemoveItem = useCallback(
    async (itemId: number) => {
      setMutatingItemId(itemId);
      setServiceError(null);
      try {
        await removeFromCart(itemId);
        setItems(prev => prev.filter(item => item.item_id !== itemId));
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

  const handleCheckout = useCallback(async () => {
    if (!hasSession) return;
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }

    setCheckoutLoading(true);
    setServiceError(null);
    try {
      const { redirect_url } = await getCheckoutRedirectLink();
      window.open(redirect_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
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
  }, [hasSession, isGuest]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items]
  );
  const hasItems = items.length > 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="heading-2 text-ink">Shopping Cart</h1>
        <Link href="/shop" className="text-sm font-medium text-brand underline">
          Continue shopping
        </Link>
      </div>

      {!hasSession && (
        <div className="rounded-xl border border-border bg-background p-8 text-center">
          <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-ink-muted/50" />
          <p className="body-text text-ink">
            Your cart is currently unavailable.
          </p>
          <p className="micro-text mt-2 text-ink-muted">
            Please refresh the page or sign in again.
          </p>
        </div>
      )}

      {hasSession && loadingItems && (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      )}

      {hasSession && !loadingItems && !hasItems && (
        <div className="rounded-xl border border-border bg-background p-12 text-center">
          <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-ink-muted/50" />
          <p className="body-text text-ink">Your cart is empty</p>
        </div>
      )}

      {hasSession && !loadingItems && hasItems && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-3">
            {items.map(item => (
              <li
                key={item.item_id}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-ink">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      SKU: {item.sku}
                    </p>
                    <div className="mt-3 flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          handleUpdateQty(item.item_id, item.qty - 1)
                        }
                        disabled={
                          mutatingItemId === item.item_id || item.qty <= 1
                        }
                        className="flex h-8 w-8 items-center justify-center rounded border border-border text-ink-muted transition hover:bg-surface hover:text-ink disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-7 text-center text-sm text-ink">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          handleUpdateQty(item.item_id, item.qty + 1)
                        }
                        disabled={mutatingItemId === item.item_id}
                        className="flex h-8 w-8 items-center justify-center rounded border border-border text-ink-muted transition hover:bg-surface hover:text-ink disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-base font-semibold text-ink">
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
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-xl border border-border bg-background p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-semibold text-ink">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            {isGuest && (
              <p className="mt-3 text-xs text-ink-muted">
                Sign in or create an account to checkout.
              </p>
            )}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="btn-primary mt-4 w-full py-3 text-sm font-semibold disabled:opacity-60"
            >
              {checkoutLoading ? 'Redirecting…' : 'Checkout'}
            </button>
            <button
              type="button"
              onClick={handleClearCart}
              disabled={clearLoading}
              className="mt-3 w-full py-2 text-sm text-ink-muted transition hover:text-ink disabled:opacity-50"
            >
              {clearLoading ? 'Clearing…' : 'Clear cart'}
            </button>
          </aside>
        </div>
      )}

      {serviceError && (
        <p role="alert" className="mt-5 text-center text-sm text-red-500">
          {serviceError}
        </p>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
        defaultTab="register"
      />
    </main>
  );
}
