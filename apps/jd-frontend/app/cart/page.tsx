'use client';

import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { env } from '@/infrastructure/config/env';
import { formatPrice } from '@prism/shared';
import {
  formatCartLineTotal,
  formatCartMoney,
  getCartSnapshot,
  getCheckoutRedirectLink,
} from '@/features/cart';
import type { CartTotals } from '@/features/cart/types';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';
import { LoginModal } from '@/features/auth';

export default function CartPage() {
  const { hasSession, isGuest } = useAuth();
  const { items, removeFromCart, clearCart, updateItemQty } = useCart();

  const [cartTotals, setCartTotals] = useState<CartTotals | null>(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [mutatingItemId, setMutatingItemId] = useState<string | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const loadCartItems = useCallback(
    async (opts?: { showSpinner?: boolean }) => {
      if (!hasSession) {
        setCartTotals(null);
        setLoadingItems(false);
        return;
      }

      const showSpinner = opts?.showSpinner !== false;
      if (showSpinner) {
        setLoadingItems(true);
      }
      setServiceError(null);
      try {
        const snapshot = await getCartSnapshot();
        setCartTotals(snapshot.totals);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        setServiceError(
          msg.includes('unavailable')
            ? 'Shop service is temporarily unavailable, please try again later.'
            : 'Failed to load cart items. Please try again.'
        );
      } finally {
        if (showSpinner) {
          setLoadingItems(false);
        }
      }
    },
    [hasSession]
  );

  useEffect(() => {
    void loadCartItems();
  }, [loadCartItems]);

  const handleUpdateQty = useCallback(
    async (itemId: string, newQty: number) => {
      if (newQty < 1) return;
      setMutatingItemId(itemId);
      setServiceError(null);
      try {
        await updateItemQty(itemId, newQty);
        setCartTotals(null);
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
    async (itemId: string) => {
      setMutatingItemId(itemId);
      setServiceError(null);
      try {
        await removeFromCart(itemId);
        setCartTotals(null);
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
      setCartTotals(null);
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
    if (isGuest && env.REQUIRE_LOGIN_FOR_CHECKOUT) {
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
        if (env.REQUIRE_LOGIN_FOR_CHECKOUT) {
          setShowLoginModal(true);
        } else {
          setServiceError(msg || 'Guest checkout is not available.');
        }
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

  const subtotalFromMagento = useMemo(() => {
    const t = cartTotals;
    return t?.subtotal_excluding_tax ?? t?.subtotal_including_tax ?? null;
  }, [cartTotals]);

  const subtotalFallback = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items]
  );
  const subtotalFallbackCurrency = items[0]?.currency ?? 'USD';
  const hasItems = items.length > 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="heading-2 text-ink">Shopping Cart</h1>
        <Link
          href="/categories"
          className="text-sm font-medium text-brand underline"
        >
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
                    {item.options && item.options.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-ink-muted">
                        {item.options.map((opt, idx) => (
                          <li key={`${item.item_id}-opt-${idx}`}>
                            <span className="text-ink-faint">{opt.label}:</span>{' '}
                            {opt.value}
                          </li>
                        ))}
                      </ul>
                    )}
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
                      {formatCartLineTotal(item)}
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
                {subtotalFromMagento
                  ? formatCartMoney(subtotalFromMagento)
                  : formatPrice(subtotalFallback, subtotalFallbackCurrency)}
              </span>
            </div>
            {cartTotals?.discount && cartTotals.discount.value !== 0 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-ink-muted">
                  {(cartTotals.discount_reason ?? 'Discount') +
                    (cartTotals.coupon_code
                      ? ` (${cartTotals.coupon_code})`
                      : '')}
                </span>
                <span className="font-semibold text-ink">
                  {formatCartMoney(cartTotals.discount)}
                </span>
              </div>
            )}
            {cartTotals?.grand_total && (
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-ink-muted">Estimated total</span>
                <span className="font-semibold text-ink">
                  {formatCartMoney(cartTotals.grand_total)}
                </span>
              </div>
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
