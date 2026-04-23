'use client';

import { env } from '@/lib/env';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/format-price';
import {
  applyCoupon,
  formatCartLineTotal,
  formatCartMoney,
  getCheckoutRedirectLink,
  removeCoupon,
} from '../../lib/api/magento/cart';
import type { CartTotals } from '../../lib/api/magento/types';
import { useAuth } from '../../lib/auth/context';
import { useCart } from '../../lib/cart/context';
import { LoginModal } from './LoginModal';

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isCartOpen,
    closeCart,
    itemCount,
    removeFromCart,
    clearCart,
    updateItemQty,
    syncCart,
  } = useCart();
  const { hasSession, isGuest } = useAuth();
  const [cartTotals, setCartTotals] = useState<CartTotals | null>(null);
  const [viewCartLoading, setViewCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [mutatingItemId, setMutatingItemId] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleViewCart = useCallback(async () => {
    if (!hasSession) return;
    setViewCartLoading(true);
    try {
      closeCart();
      router.push('/cart');
      // const { redirect_url } = await getCartRedirectLink();
      // window.open(redirect_url, '_blank', 'noopener,noreferrer');
    } finally {
      setViewCartLoading(false);
    }
  }, [closeCart, hasSession, router]);

  const handleCheckout = useCallback(async () => {
    if (!hasSession) return;

    // 游客直接弹出登录引导
    if (isGuest && env.REQUIRE_LOGIN_FOR_CHECKOUT) {
      setShowLoginModal(true);
      return;
    }

    setCheckoutLoading(true);
    setServiceError(null);
    try {
      const { redirect_url } = await getCheckoutRedirectLink();
      closeCart();
      window.location.assign(redirect_url);
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
  }, [closeCart, hasSession, isGuest]);

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

  const handleApplyCoupon = useCallback(async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    setServiceError(null);
    try {
      const snapshot = await applyCoupon(code);
      setCartTotals(snapshot.totals);
      await syncCart();
      setCouponCode('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setCouponError(
        msg.includes('unavailable')
          ? 'Service temporarily unavailable, please try again later.'
          : msg ||
              'Failed to apply coupon. Please check the code and try again.'
      );
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, syncCart]);

  const handleRemoveCoupon = useCallback(async () => {
    setCouponLoading(true);
    setCouponError(null);
    setServiceError(null);
    try {
      const snapshot = await removeCoupon();
      setCartTotals(snapshot.totals);
      await syncCart();
      setCouponCode('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setCouponError(
        msg.includes('unavailable')
          ? 'Service temporarily unavailable, please try again later.'
          : msg || 'Failed to remove coupon. Please try again.'
      );
    } finally {
      setCouponLoading(false);
    }
  }, [syncCart]);

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

  const subtotalFromMagento = useMemo(() => {
    const t = cartTotals;
    return t?.subtotal_excluding_tax ?? t?.subtotal_including_tax ?? null;
  }, [cartTotals]);

  const subtotalFallback = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const subtotalFallbackCurrency = items[0]?.currency ?? 'USD';
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
          {!hasItems && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="mb-3 h-10 w-10 text-ink-muted/40" />
              <p className="text-sm font-medium text-ink-muted">
                Your cart is empty
              </p>
            </div>
          )}

          {hasItems && (
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
                    {item.options && item.options.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 text-[11px] text-ink-muted">
                        {item.options.map((opt, idx) => (
                          <li key={`${item.item_id}-opt-${idx}`}>
                            <span className="text-ink-faint">{opt.label}:</span>{' '}
                            {opt.value}
                          </li>
                        ))}
                      </ul>
                    )}
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
            {/* Coupon code */}
            <div className="space-y-2">
              {cartTotals?.coupon_code ? (
                <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                  <span className="text-sm text-ink">
                    Coupon:{' '}
                    <span className="font-semibold">
                      {cartTotals.coupon_code}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    disabled={couponLoading}
                    className="text-sm text-red-500 transition hover:text-red-600 disabled:opacity-50"
                  >
                    {couponLoading ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        void handleApplyCoupon();
                      }
                    }}
                    placeholder="Enter coupon code"
                    className="min-h-touch flex-1 rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-brand"
                    disabled={couponLoading}
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyCoupon()}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-xs text-red-500">{couponError}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-semibold text-ink">
                {subtotalFromMagento
                  ? formatCartMoney(subtotalFromMagento)
                  : formatPrice(subtotalFallback, subtotalFallbackCurrency)}
              </span>
            </div>
            {cartTotals?.discount && cartTotals.discount.value !== 0 && (
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>
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
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>Estimated total</span>
                <span className="font-semibold text-ink">
                  {formatCartMoney(cartTotals.grand_total)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleClearCart}
              disabled={clearLoading}
              className="w-full py-2 text-sm text-ink-muted transition hover:text-ink disabled:opacity-50"
            >
              {clearLoading ? 'Clearing…' : 'Clear cart'}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleViewCart}
                disabled={viewCartLoading || checkoutLoading}
                className="flex-1 rounded-full border border-border bg-transparent py-3 text-sm font-semibold text-ink transition hover:bg-surface disabled:opacity-60"
              >
                {viewCartLoading ? 'Redirecting…' : 'View cart'}
              </button>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkoutLoading || viewCartLoading}
                className="btn-primary flex-1 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {checkoutLoading ? 'Redirecting…' : 'Checkout'}
              </button>
            </div>
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
