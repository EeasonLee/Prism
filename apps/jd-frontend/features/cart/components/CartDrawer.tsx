'use client';

import { env } from '@/infrastructure/config/env';
import {
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { formatPrice } from '@prism/shared';
import {
  applyCoupon,
  formatCartLineTotal,
  formatCartMoney,
  getCartSnapshot,
  getCheckoutRedirectLink,
  removeCoupon,
} from '../api/cart-bff.service';
import type { CartTotals } from '../types';
import { useAuth } from '@/features/auth';
import { useCart } from './cart.context';
import { LoginModal } from '@/features/auth';
import { buildProductUrl } from '@/features/product';
import {
  gtmBeginCheckout,
  gtmRemoveFromCart,
  mapCartItemToGtmItem,
} from '@/shared/utils/gtm';

interface CartEnrichmentData {
  sku: string;
  name: string;
  image: string | null;
  url_key: string | null;
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
  /** Real-time inventory from catalog-sync-service */
  inventory?: {
    salable_qty: number;
    is_salable: boolean;
    stock_status: string;
  } | null;
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
  const {
    items,
    isCartInitializing,
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

    let cancelled = false;

    const fetchInventoryBatch = async (skus: string[]) => {
      if (skus.length === 0) return;
      try {
        const res = await fetch('/api/inventory/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skus }),
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          success: boolean;
          data?: {
            items?: Record<
              string,
              {
                sku: string;
                salable_qty: number;
                is_salable: boolean;
                stock_status: string;
              }
            >;
            not_found?: string[];
          };
        };

        if (!json.success || !json.data) return;

        const inventoryMap = json.data.items ?? {};
        const notFound = new Set(json.data.not_found ?? []);

        // Update enrichment with inventory data
        setEnrichment(prev => {
          const next: Record<string, CartEnrichmentData | null> = { ...prev };
          for (const [raw, normalized] of rawToNormalized) {
            const existing = next[raw];
            if (!existing) continue;

            if (inventoryMap[normalized]) {
              next[raw] = {
                ...existing,
                inventory: {
                  salable_qty: inventoryMap[normalized].salable_qty,
                  is_salable: inventoryMap[normalized].is_salable,
                  stock_status: inventoryMap[normalized].stock_status,
                },
              };
            } else if (notFound.has(normalized)) {
              // SKU not found in inventory system = treat as out of stock
              next[raw] = {
                ...existing,
                inventory: {
                  salable_qty: 0,
                  is_salable: false,
                  stock_status: 'out_of_stock',
                },
              };
            }
          }
          return next;
        });
      } catch {
        // Inventory fetch is best-effort; don't block cart rendering
      }
    };

    if (uncached.length === 0) {
      // All cached — still run inventory check in case stock changed
      void fetchInventoryBatch([...normalizedSet]);
      return () => {
        cancelled = true;
      };
    }

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

        // After enrichment, fetch real-time inventory for all SKUs
        const allNormalized = [...normalizedSet];
        await fetchInventoryBatch(allNormalized);
      } catch {
        // Serve from cache on error — already set above
      }
    };

    void fetchAll();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const handleCheckout = useCallback(async () => {
    if (!hasSession) return;

    if (isGuest && env.REQUIRE_LOGIN_FOR_CHECKOUT) {
      setShowLoginModal(true);
      return;
    }

    setCheckoutLoading(true);
    setServiceError(null);
    try {
      // GTM: begin_checkout event
      const gtmItems = items.map(item => mapCartItemToGtmItem(item));
      gtmBeginCheckout(gtmItems);

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
  }, [closeCart, hasSession, isGuest, items]);

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      const item = items.find(i => i.item_id === itemId);
      setMutatingItemId(itemId);
      setServiceError(null);
      try {
        await removeFromCart(itemId);
        // GTM: remove_from_cart event
        if (item) {
          gtmRemoveFromCart(mapCartItemToGtmItem(item), item.qty);
        }
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
    [removeFromCart, items]
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

  // Check if any item has stock issues — disable checkout when true
  const hasStockIssues = useMemo(() => {
    return items.some(item => {
      const stock = enrichment[item.sku]?.inventory;
      if (!stock) return false;
      return (
        !stock.is_salable ||
        (stock.salable_qty > 0 && item.qty > stock.salable_qty)
      );
    });
  }, [items, enrichment]);

  // 购物车抽屉打开时同步 totals，确保自动用券后也能展示当前 coupon
  useEffect(() => {
    if (!isCartOpen || !hasItems) {
      if (!hasItems) setCartTotals(null);
      return;
    }

    let cancelled = false;
    const syncTotals = async () => {
      try {
        const snapshot = await getCartSnapshot();
        if (!cancelled) {
          setCartTotals(snapshot.totals);
        }
      } catch {
        // totals 同步失败时不阻塞抽屉渲染
      }
    };

    void syncTotals();
    return () => {
      cancelled = true;
    };
  }, [isCartOpen, hasItems, items]);

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
          {isCartInitializing && !hasItems && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="mb-3 h-10 w-10 animate-spin text-ink-muted/40" />
              <p className="text-sm font-medium text-ink-muted">
                Loading cart...
              </p>
            </div>
          )}

          {!isCartInitializing && !hasItems && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="mb-3 h-10 w-10 text-ink-muted/40" />
              <p className="text-sm font-medium text-ink-muted">
                Your cart is empty
              </p>
            </div>
          )}

          {hasItems && (
            <ul className="space-y-3">
              {items
                .slice()
                .sort((a, b) => {
                  // Sort out-of-stock / over-qty items to the top
                  const aEnrich = enrichment[a.sku];
                  const bEnrich = enrichment[b.sku];
                  const aStock = aEnrich?.inventory;
                  const bStock = bEnrich?.inventory;
                  const aBad =
                    aStock &&
                    (!aStock.is_salable ||
                      (aStock.salable_qty > 0 && a.qty > aStock.salable_qty));
                  const bBad =
                    bStock &&
                    (!bStock.is_salable ||
                      (bStock.salable_qty > 0 && b.qty > bStock.salable_qty));
                  if (aBad && !bBad) return -1;
                  if (!aBad && bBad) return 1;
                  return 0;
                })
                .map(item => {
                  const enrich = enrichment[item.sku];
                  const optionLabelMap = buildOptionLabelMap(
                    enrich ?? undefined
                  );
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

                  const productUrl = buildProductUrl({
                    url_key: enrich?.url_key ?? null,
                    sku: item.sku,
                    cp_code: null,
                  });

                  // Real-time stock check
                  const stock = enrich?.inventory;
                  const isOutOfStock = stock && !stock.is_salable;
                  const isOverQty =
                    stock &&
                    stock.salable_qty > 0 &&
                    item.qty > stock.salable_qty;
                  const stockWarning = isOutOfStock
                    ? 'The requested qty is not available'
                    : isOverQty
                    ? `The requested qty is not available (max ${stock.salable_qty})`
                    : null;

                  return (
                    <li
                      key={item.item_id}
                      className={`flex items-start gap-3 rounded-lg p-3 ${
                        stockWarning
                          ? 'border-[3px] border-red-300 bg-red-50/60'
                          : 'border border-border'
                      }`}
                    >
                      {/* Product image */}
                      {imageUrl ? (
                        <Link
                          href={productUrl}
                          onClick={closeCart}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface"
                        >
                          <OptimizedImage
                            src={imageUrl}
                            alt={displayName}
                            width={64}
                            height={64}
                            maxDisplayWidth={64}
                            className="h-full w-full object-cover"
                          />
                        </Link>
                      ) : (
                        <Link
                          href={productUrl}
                          onClick={closeCart}
                          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-surface"
                        >
                          <ShoppingCart className="h-5 w-5 text-ink-muted/30" />
                        </Link>
                      )}

                      <div className="min-w-0 flex-1">
                        <Link
                          href={productUrl}
                          onClick={closeCart}
                          className="block text-sm font-medium leading-snug text-ink transition hover:text-brand"
                        >
                          {displayName}
                        </Link>
                        {stockWarning && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-red-600">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            {stockWarning}
                          </p>
                        )}
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
                                  ...(enrich?.parent_configurable_options ??
                                    []),
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
                        <div className="mt-2 inline-flex items-center overflow-hidden rounded-md border border-border bg-surface">
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
                              stock?.salable_qty > 0
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
                            className="flex h-8 w-12 min-w-[2.5rem] items-center justify-center border-x border-border bg-surface px-1 text-center text-sm font-semibold text-ink outline-none [appearance:textfield] disabled:opacity-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

          {hasItems && items.length > 2 && (
            <button
              type="button"
              onClick={handleClearCart}
              disabled={clearLoading}
              className="mt-3 w-full py-2 text-sm text-ink-muted transition hover:text-ink disabled:opacity-50"
            >
              {clearLoading ? 'Clearing…' : 'Clear cart'}
            </button>
          )}

          {serviceError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <span>{serviceError}</span>
            </div>
          )}
        </div>

        {hasItems && (
          <div className="space-y-3 border-t border-border px-5 py-4">
            {/* Coupon code */}
            <div className="space-y-2">
              {cartTotals?.coupon_code ? (
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
                      onClick={handleRemoveCoupon}
                      disabled={couponLoading}
                      className="text-sm text-red-500 transition hover:text-red-600 disabled:opacity-50"
                    >
                      {couponLoading ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                  <div className="border-t border-border/70" />
                </div>
              ) : (
                <div className="space-y-2">
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
                  {couponError && (
                    <div className="rounded-lg bg-red-50 px-3 py-2">
                      <p className="text-sm text-red-600">{couponError}</p>
                    </div>
                  )}
                </div>
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
              <>
                <div className="flex items-center justify-between text-sm text-ink">
                  <span>
                    {cartTotals.coupon_code
                      ? `Discount (${cartTotals.coupon_code})`
                      : cartTotals.discount_reason ?? 'Discount'}
                  </span>
                  <span className="font-semibold text-ink">
                    {formatCartMoney(cartTotals.discount)}
                  </span>
                </div>
                <div className="border-t border-border/70" />
              </>
            )}
            {cartTotals?.grand_total && (
              <div className="flex items-center justify-between text-base font-bold text-ink">
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
                ? 'Redirecting…'
                : hasStockIssues
                ? 'Please adjust quantities to proceed'
                : 'Checkout'}
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
