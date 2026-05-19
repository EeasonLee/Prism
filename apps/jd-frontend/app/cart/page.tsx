'use client';

import { env } from '@/infrastructure/config/env';
import { PageContainer, OptimizedImage } from '@prism/ui';
import { formatPrice } from '@prism/shared';
import {
  AlertTriangle,
  CreditCard,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoginModal, useAuth } from '@/features/auth';
import {
  formatCartLineTotal,
  formatCartMoney,
  getCartSnapshot,
  getCheckoutRedirectLink,
  removeCoupon,
  resolveCartItemView,
  sortCartItemsByStock,
  useCartEnrichment,
  useCart,
} from '@/features/cart';
import type { CartTotals } from '@/features/cart/types';
import {
  gtmBeginCheckout,
  gtmRemoveFromCart,
  mapCartItemToGtmItem,
} from '@/shared/utils/gtm';

export default function CartPage() {
  const { hasSession, isGuest } = useAuth();
  const { items, removeFromCart, clearCart, updateItemQty, syncCart } =
    useCart();

  const [cartTotals, setCartTotals] = useState<CartTotals | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mutatingItemId, setMutatingItemId] = useState<string | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const enrichment = useCartEnrichment(items);

  const hasItems = items.length > 0;

  useEffect(() => {
    if (!hasSession) {
      setCartTotals(null);
      setInitialLoading(false);
      return;
    }

    let cancelled = false;

    const syncTotals = async () => {
      try {
        const snapshot = await getCartSnapshot();
        if (!cancelled) {
          setCartTotals(snapshot.totals);
          setServiceError(null);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (!cancelled) {
          setServiceError(
            msg.includes('unavailable')
              ? 'Shop service is temporarily unavailable, please try again later.'
              : 'Failed to load cart totals. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    };

    void syncTotals();

    return () => {
      cancelled = true;
    };
  }, [hasSession, items]);

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
      const item = items.find(i => i.item_id === itemId);
      setMutatingItemId(itemId);
      setServiceError(null);
      try {
        await removeFromCart(itemId);
        setCartTotals(null);
        if (item) {
          gtmRemoveFromCart(mapCartItemToGtmItem(item), item.qty);
        }
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
    [items, removeFromCart]
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

  const handleRemoveCoupon = useCallback(async () => {
    setCouponLoading(true);
    setCouponError(null);
    setServiceError(null);
    try {
      const snapshot = await removeCoupon();
      setCartTotals(snapshot.totals);
      await syncCart();
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

  const handleCheckout = useCallback(async () => {
    if (!hasSession) return;
    if (isGuest && env.REQUIRE_LOGIN_FOR_CHECKOUT) {
      setShowLoginModal(true);
      return;
    }

    setCheckoutLoading(true);
    setServiceError(null);
    try {
      gtmBeginCheckout(items.map(item => mapCartItemToGtmItem(item)));

      const { redirect_url } = await getCheckoutRedirectLink();
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
  }, [hasSession, isGuest, items]);

  const subtotalFromMagento = useMemo(() => {
    const t = cartTotals;
    return t?.subtotal_excluding_tax ?? t?.subtotal_including_tax ?? null;
  }, [cartTotals]);

  const subtotalFallback = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items]
  );
  const subtotalFallbackCurrency = items[0]?.currency ?? 'USD';
  const sortedItems = useMemo(
    () => sortCartItemsByStock(items, enrichment),
    [enrichment, items]
  );
  const hasStockIssues = useMemo(
    () =>
      items.some(
        item => resolveCartItemView(item, enrichment[item.sku]).stockWarning
      ),
    [enrichment, items]
  );
  const showInitialSkeleton = hasSession && initialLoading && !hasItems;

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-background pb-24 md:pb-0">
      <PageContainer className="max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h1 className="text-3xl font-bold leading-none text-ink sm:text-4xl">
            Shopping Cart
          </h1>
          <Link
            href="/categories/kitchen-appliances"
            className="shrink-0 text-sm font-medium text-brand underline"
          >
            Continue shopping
          </Link>
        </div>

        {!hasSession && (
          <div className="rounded-lg border border-border bg-background p-8 text-center">
            <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-ink-muted/50" />
            <p className="text-sm font-medium text-ink">
              Your cart is currently unavailable.
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Please refresh the page or sign in again.
            </p>
          </div>
        )}

        {showInitialSkeleton && (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="h-24 animate-pulse rounded-lg bg-surface"
              />
            ))}
          </div>
        )}

        {hasSession && !showInitialSkeleton && !hasItems && (
          <div className="rounded-lg border border-border bg-background p-12 text-center">
            <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-ink-muted/50" />
            <p className="text-sm font-medium text-ink">Your cart is empty</p>
          </div>
        )}

        {hasSession && hasItems && (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <ul className="space-y-3">
              {sortedItems.map(item => {
                const itemView = resolveCartItemView(
                  item,
                  enrichment[item.sku]
                );
                const stock = enrichment[item.sku]?.inventory;

                return (
                  <li
                    key={item.item_id}
                    className={`flex gap-3 rounded-lg bg-background p-3 ${
                      itemView.stockWarning
                        ? 'border-[3px] border-red-300 bg-red-50/60'
                        : 'border border-border'
                    }`}
                  >
                    {itemView.imageUrl ? (
                      <Link
                        href={itemView.productUrl}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface sm:h-24 sm:w-24"
                      >
                        <OptimizedImage
                          src={itemView.imageUrl}
                          alt={item.name}
                          width={96}
                          height={96}
                          maxDisplayWidth={96}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                    ) : (
                      <Link
                        href={itemView.productUrl}
                        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-surface sm:h-24 sm:w-24"
                      >
                        <ShoppingCart className="h-6 w-6 text-ink-muted/30" />
                      </Link>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={itemView.productUrl}
                            className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition hover:text-brand sm:text-base"
                          >
                            {item.name}
                          </Link>
                          {itemView.stockWarning && (
                            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              {itemView.stockWarning}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-ink-muted">
                            SKU: {item.sku}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-ink">
                            {formatCartLineTotal(item)}
                          </p>
                          <button
                            type="button"
                            aria-label={`Remove ${item.name} from cart`}
                            onClick={() => void handleRemoveItem(item.item_id)}
                            disabled={mutatingItemId === item.item_id}
                            className="ml-auto mt-1 flex h-8 w-8 items-center justify-center rounded text-ink-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {itemView.options.length > 0 && (
                        <ul className="mt-2 space-y-0.5 text-xs text-ink-muted">
                          {itemView.options.map((opt, idx) => (
                            <li key={`${item.item_id}-opt-${idx}`}>
                              <span className="text-ink-faint">
                                {opt.label}:
                              </span>{' '}
                              {opt.value}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3 inline-flex items-center overflow-hidden rounded-md border border-border bg-surface">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            void handleUpdateQty(item.item_id, item.qty - 1)
                          }
                          disabled={
                            mutatingItemId === item.item_id || item.qty <= 1
                          }
                          className="flex h-8 w-8 items-center justify-center text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:opacity-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={
                            stock?.salable_qty && stock.salable_qty > 0
                              ? stock.salable_qty
                              : undefined
                          }
                          value={item.qty}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            if (!Number.isNaN(val) && val >= 1) {
                              void handleUpdateQty(item.item_id, val);
                            }
                          }}
                          onBlur={e => {
                            const val = parseInt(e.target.value, 10);
                            if (Number.isNaN(val) || val < 1) {
                              void handleUpdateQty(item.item_id, 1);
                            }
                          }}
                          disabled={mutatingItemId === item.item_id}
                          className="flex h-8 w-12 min-w-[2.5rem] items-center justify-center border-x border-border bg-surface px-1 text-center text-sm font-semibold text-ink outline-none [appearance:textfield] disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            void handleUpdateQty(item.item_id, item.qty + 1)
                          }
                          disabled={mutatingItemId === item.item_id}
                          className="flex h-8 w-8 items-center justify-center text-ink-muted transition hover:bg-surface-hover hover:text-ink disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="h-fit space-y-3 rounded-lg border border-border bg-background p-4 lg:sticky lg:top-24">
              {cartTotals?.coupon_code && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                    <span className="text-sm text-ink">
                      Coupon:{' '}
                      <span className="font-semibold">
                        {cartTotals.coupon_code}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleRemoveCoupon()}
                      disabled={couponLoading}
                      className="text-sm text-red-500 transition hover:text-red-600 disabled:opacity-50"
                    >
                      {couponLoading ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                  {couponError && (
                    <div className="rounded-lg bg-red-50 px-3 py-2">
                      <p className="text-sm text-red-600">{couponError}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">Subtotal</span>
                <span className="font-semibold text-ink">
                  {subtotalFromMagento
                    ? formatCartMoney(subtotalFromMagento)
                    : formatPrice(subtotalFallback, subtotalFallbackCurrency)}
                </span>
              </div>
              {cartTotals?.discount && cartTotals.discount.value !== 0 && (
                <div className="flex items-center justify-between gap-3 text-sm text-ink">
                  <span className="min-w-0">
                    {cartTotals.coupon_code
                      ? `Discount (${cartTotals.coupon_code})`
                      : cartTotals.discount_reason ?? 'Discount'}
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatCartMoney(cartTotals.discount)}
                  </span>
                </div>
              )}
              {cartTotals?.grand_total && (
                <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold text-ink">
                  <span>Estimated total</span>
                  <span>{formatCartMoney(cartTotals.grand_total)}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkoutLoading || hasStockIssues}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold disabled:opacity-60"
              >
                <CreditCard className="h-5 w-5" />
                {checkoutLoading
                  ? 'Redirecting...'
                  : hasStockIssues
                  ? 'Please adjust quantities to proceed'
                  : 'Checkout'}
              </button>
              <button
                type="button"
                onClick={handleClearCart}
                disabled={clearLoading}
                className="w-full py-2 text-sm text-ink-muted transition hover:text-ink disabled:opacity-50"
              >
                {clearLoading ? 'Clearing...' : 'Clear cart'}
              </button>
            </aside>
          </div>
        )}

        {serviceError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serviceError}</span>
          </div>
        )}

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
          defaultTab="register"
        />
      </PageContainer>
    </main>
  );
}
