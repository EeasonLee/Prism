'use client';

import { env } from '@/core/config/env';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/shared/utils/format-price';
import {
  applyCoupon,
  formatCartLineTotal,
  formatCartMoney,
  getCheckoutRedirectLink,
  removeCoupon,
} from '@/lib/api/magento/cart';
import type { CartTotals } from '@/features/cart/types';
import { useAuth } from '@/features/auth/auth.context';
import { useCart } from '@/features/cart/cart.context';
import { LoginModal } from '@/features/auth/LoginModal';

interface CartEnrichmentData {
  sku: string;
  name: string;
  image: string | null;
  configurable_options: Array<{
    attribute_id: string;
    attribute_code: string;
    label: string;
    values: Array<{ value_index: string; label: string }>;
  }>;
  custom_options: Array<{
    option_id: number;
    title: string;
    type: string;
    required: boolean;
    values?: Array<{
      option_type_id: number;
      title: string;
      price: number;
      price_type: string;
      sku: string;
      sort_order: number;
    }>;
  }>;
  parent_sku: string | null;
  parent_url: string | null;
  parent_configurable_options: Array<{
    attribute_id: string;
    attribute_code: string;
    label: string;
    values: Array<{ value_index: string; label: string }>;
  }> | null;
  parent_custom_options: Array<{
    option_id: number;
    title: string;
    type: string;
    required: boolean;
    values?: Array<{
      option_type_id: number;
      title: string;
      price: number;
      price_type: string;
      sku: string;
      sort_order: number;
    }>;
  }> | null;
  variants: Array<{
    sku: string;
    price: number;
    final_price: number;
    is_in_stock: boolean;
    image_url: string | null;
    option_values: Record<string, string>;
  }>;
}

function normalizeCartSku(sku: string): string {
  const commaIdx = sku.indexOf(',');
  return commaIdx > 0 ? sku.slice(0, commaIdx).trim() : sku.trim();
}

function buildOptionLabelMap(
  enrichment: CartEnrichmentData | undefined
): Record<string, string> | null {
  const source = enrichment?.configurable_options?.length
    ? enrichment.configurable_options
    : enrichment?.parent_configurable_options?.length
    ? enrichment.parent_configurable_options
    : [];
  if (source.length === 0) return null;
  const map: Record<string, string> = {};
  for (const opt of source) {
    for (const v of opt.values) {
      map[v.value_index] = v.label;
    }
  }
  return map;
}

function buildCustomOptionLabelMap(
  enrichment: CartEnrichmentData | undefined
): Record<string, { title: string; values: Record<string, string> }> | null {
  const source = enrichment?.custom_options?.length
    ? enrichment.custom_options
    : enrichment?.parent_custom_options?.length
    ? enrichment.parent_custom_options
    : [];
  if (source.length === 0) return null;
  const map: Record<string, { title: string; values: Record<string, string> }> =
    {};
  for (const opt of source) {
    const valueMap: Record<string, string> = {};
    for (const v of opt.values ?? []) {
      valueMap[String(v.option_type_id)] = v.title;
    }
    map[String(opt.option_id)] = { title: opt.title, values: valueMap };
  }
  return map;
}

function findVariantImage(
  enrichment: CartEnrichmentData | undefined,
  cartOptions: Array<{ label: string; value: string }> | undefined
): string | null {
  if (!enrichment || enrichment.variants.length === 0) return null;

  // Build a map of selected attribute values from cart options
  const selectedValues: Record<string, string> = {};
  for (const opt of cartOptions ?? []) {
    // configurable_item_options come as numeric option_id -> option_value
    selectedValues[opt.label] = opt.value;
  }

  // Find matching variant by comparing option_values
  for (const variant of enrichment.variants) {
    const variantValues = variant.option_values ?? {};
    let match = true;
    for (const [key, val] of Object.entries(selectedValues)) {
      if (variantValues[key] !== val) {
        match = false;
        break;
      }
    }
    if (match && variant.image_url) {
      return variant.image_url;
    }
  }

  return null;
}

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
  const [enrichment, setEnrichment] = useState<
    Record<string, CartEnrichmentData | null>
  >({});
  // Persist enrichment across cart open/close — re-fetch only when items change
  const cacheRef = useRef<Record<string, CartEnrichmentData | null>>({});

  // Fetch product info (image + configurable options + custom options + variants) when cart items change
  useEffect(() => {
    if (items.length === 0) {
      setEnrichment({});
      return;
    }

    // Collect unique normalized SKUs
    const rawToNormalized = new Map<string, string>();
    for (const item of items) {
      if (!item.sku) continue;
      rawToNormalized.set(item.sku, normalizeCartSku(item.sku));
    }
    const normalizedSet = new Set(rawToNormalized.values());

    // Check cache: which normalized SKUs are missing?
    const uncached = [...normalizedSet].filter(
      sku => !(sku in cacheRef.current)
    );

    // Build from cache immediately for instant render
    const cachedMap: Record<string, CartEnrichmentData | null> = {};
    for (const [raw, normalized] of rawToNormalized) {
      cachedMap[raw] = cacheRef.current[normalized] ?? null;
    }
    setEnrichment(cachedMap);

    if (uncached.length === 0) return;

    let cancelled = false;

    const fetchAll = async () => {
      try {
        const res = await fetch(
          `/api/products?skus=${uncached
            .map(s => encodeURIComponent(s))
            .join(',')}`
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          success: boolean;
          data?: Record<string, CartEnrichmentData | null>;
        };
        if (!json.success || !json.data) return;

        // Update cache
        Object.assign(cacheRef.current, json.data);

        if (cancelled) return;
        // Merge fresh data for all items
        const merged: Record<string, CartEnrichmentData | null> = {};
        for (const [raw, normalized] of rawToNormalized) {
          merged[raw] = cacheRef.current[normalized] ?? null;
        }
        setEnrichment(merged);
      } catch {
        // Serve from cache on error — already set above
      }
    };

    void fetchAll();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const handleViewCart = useCallback(async () => {
    if (!hasSession) return;
    setViewCartLoading(true);
    try {
      closeCart();
      router.push('/cart');
    } finally {
      setViewCartLoading(false);
    }
  }, [closeCart, hasSession, router]);

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
              {items.map(item => {
                const enrich = enrichment[item.sku];
                const optionLabelMap = buildOptionLabelMap(enrich ?? undefined);
                const customOptionLabelMap = buildCustomOptionLabelMap(
                  enrich ?? undefined
                );

                // Variant image: try to match cart options against variant option_values
                const variantImage = findVariantImage(
                  enrich ?? undefined,
                  item.options
                );
                const imageUrl =
                  variantImage ?? enrich?.image ?? item.thumbnail ?? null;

                // For configurable products, show variant label + base name
                const displayName = item.name;

                return (
                  <li
                    key={item.item_id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    {/* Product image */}
                    {imageUrl ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface">
                        <Image
                          src={imageUrl}
                          alt={displayName}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-surface">
                        <ShoppingCart className="h-5 w-5 text-ink-muted/30" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {displayName}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        SKU: {item.sku}
                      </p>
                      {item.options && item.options.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5 text-[11px] text-ink-muted">
                          {item.options.map((opt, idx) => {
                            // Check if this is a configurable option
                            // (numeric label = option_id, or "Configurable {id}" from REST)
                            const isConfigurable =
                              /^\d+$/.test(opt.label) ||
                              opt.label.startsWith('Configurable ');
                            // Check if this is a custom option
                            const isCustom = opt.label.startsWith('Custom ');

                            let resolvedLabel = opt.label;
                            let resolvedValue = opt.value;

                            if (isConfigurable && optionLabelMap) {
                              resolvedValue =
                                optionLabelMap[opt.value] ?? opt.value;
                              // Extract attribute ID from label
                              const attrId = opt.label
                                .replace('Configurable ', '')
                                .trim();
                              const allConfigurableOpts = [
                                ...(enrich?.configurable_options ?? []),
                                ...(enrich?.parent_configurable_options ?? []),
                              ];
                              const configOpt = allConfigurableOpts.find(
                                co =>
                                  co.attribute_id === attrId ||
                                  co.attribute_code === attrId
                              );
                              if (configOpt) {
                                resolvedLabel = configOpt.label;
                              }
                            }

                            if (isCustom && customOptionLabelMap) {
                              const customOptId = opt.label.replace(
                                'Custom ',
                                ''
                              );
                              const customOpt =
                                customOptionLabelMap[customOptId];
                              if (customOpt) {
                                resolvedLabel = customOpt.title;
                                // custom option values can be comma-separated option_type_ids
                                const valueIds = opt.value
                                  .split(',')
                                  .map(v => v.trim());
                                const resolvedValues = valueIds
                                  .map(vid => customOpt.values[vid] ?? vid)
                                  .filter(Boolean);
                                resolvedValue = resolvedValues.join(', ');
                              }
                            }

                            return (
                              <li key={`${item.item_id}-opt-${idx}`}>
                                <span className="text-ink-faint">
                                  {resolvedLabel}:
                                </span>{' '}
                                {resolvedValue}
                              </li>
                            );
                          })}
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
                );
              })}
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
