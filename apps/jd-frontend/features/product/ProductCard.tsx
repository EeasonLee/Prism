'use client';

import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatPrice } from '@/shared/utils/format-price';
import { processImageUrl, processProductImageUrl } from '@prism/shared';
import type { ProductCardItem } from '@/features/product/bff-types';
import { useCart } from '@/features/cart/cart.context';
import { useAddToCartAction } from '@/features/cart/use-add-to-cart-action';
import { QuickAddModal } from '@/features/product/QuickAddModal';

interface ProductCardProps {
  product: ProductCardItem;
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

let starIdCounter = 0;

/**
 * 根据 Meilisearch 返回的背景色计算文字颜色（避免固定 token，因背景为运营配置）。
 * 使用 CSS 颜色关键字以通过 lint；非 #RRGGBB 时回退为白字。
 */
function contrastForegroundForBackground(
  background: string
): 'black' | 'white' {
  const raw = background.trim().replace('#', '');
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map(c => c + c)
          .join('')
      : raw;
  const match = /^([0-9a-fA-F]{6})$/.exec(expanded);
  if (!match) return 'white';
  const n = parseInt(match[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const [rs, gs, bs] = [r, g, b].map(c => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  return luminance > 0.45 ? 'black' : 'white';
}

function StarRating({ percentage }: { percentage: number }) {
  const score = (percentage / 100) * 5;
  const fullStars = Math.floor(score);
  const fraction = score - fullStars;
  const hasHalf = fraction >= 0.25 && fraction < 0.75;
  const clipId = `star-half-${++starIdCounter}`;

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${score.toFixed(1)} out of 5 stars`}
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="10" height="20" />
          </clipPath>
        </defs>
      </svg>
      {Array.from({ length: 5 }, (_, i) => {
        const isFilled = i < fullStars;
        const isHalf = hasHalf && i === fullStars;
        return (
          <svg
            key={i}
            className="relative h-3 w-3"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d={STAR_PATH} fill="currentColor" className="text-border" />
            {(isFilled || isHalf) && (
              <path
                d={STAR_PATH}
                fill="currentColor"
                className="text-brand"
                clipPath={isHalf ? `url(#${clipId})` : undefined}
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, getQtyBySku, updateItemQty, removeFromCart } = useCart();
  const {
    addItemToCart,
    isAdding,
    error: addError,
    clearError,
  } = useAddToCartAction();
  const priceValue = product.price.value;
  const currencyCode = product.price.currency;
  const originalPrice = product.originalPrice;
  const hasDiscount =
    priceValue != null && originalPrice != null && originalPrice > priceValue;
  const typeKey = product.type ?? 'simple';
  const hasRating = product.ratingPercentage > 0;
  const ratingScore = (product.ratingPercentage / 100) * 5;
  const isOutOfStock = product.inStock === false;
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quickViewData, setQuickViewData] = useState<
    Parameters<typeof QuickAddModal>[0]['variantData'] | null
  >(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [quickViewError, setQuickViewError] = useState<string | null>(null);
  const [qtyBusy, setQtyBusy] = useState(false);

  const supportsDirectQuantity = typeKey === 'simple' || typeKey === 'virtual';

  const rawImage = product.image?.trim() ?? null;
  const imageUrl = rawImage
    ? rawImage.startsWith('http://') || rawImage.startsWith('https://')
      ? rawImage
      : processProductImageUrl(rawImage) ??
        processImageUrl(rawImage) ??
        rawImage
    : null;
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [imageUrl]);

  const cartQty = useMemo(() => {
    if (typeKey === 'configurable' && quickViewData) {
      const variantSkuSet = new Set([
        product.sku,
        ...quickViewData.variants.map(variant => variant.sku),
      ]);
      return items.reduce((sum, item) => {
        if (!variantSkuSet.has(item.sku)) return sum;
        return sum + item.qty;
      }, 0);
    }
    return getQtyBySku(product.sku);
  }, [typeKey, quickViewData, product.sku, items, getQtyBySku]);

  const cartLineForSku = useMemo(
    () => items.find(item => item.sku === product.sku),
    [items, product.sku]
  );

  const cpLabel = product.cpLabel;
  const cpLabelColor = product.cpLabelColor;

  const addSimpleProduct = async () => {
    await addItemToCart(
      { sku: product.sku, qty: 1 },
      {
        openCartOnSuccess: true,
      }
    );
  };

  const fetchConfigurableVariants = async () => {
    if (quickViewLoading) return;
    setQuickViewLoading(true);
    setQuickViewError(null);
    try {
      const response = await fetch(
        `/api/products/${encodeURIComponent(product.sku)}/variants`
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: {
          options: Array<{
            attribute_id: number;
            code: string;
            label: string;
            values: Array<{ label: string; value: string }>;
          }>;
          customizable_options: Array<{
            option_id: number;
            title: string;
            required: boolean;
            type: string;
            values?: Array<{
              option_type_id: number;
              title: string;
              price: number;
            }>;
          }>;
          variants: Array<{
            sku: string;
            attributes: Record<string, string>;
            inStock: boolean;
            price: number;
          }>;
        };
        error?: { message?: string };
      };
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? 'Failed to load variants.');
      }
      setQuickViewData(payload.data);
    } catch (error) {
      setQuickViewError(
        error instanceof Error ? error.message : 'Failed to load variants.'
      );
    } finally {
      setQuickViewLoading(false);
    }
  };

  const handlePrimaryAction = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (isOutOfStock || isAdding || qtyBusy) return;

    if (typeKey === 'configurable') {
      setIsQuickViewOpen(true);
      clearError();
      setQuickViewError(null);
      await fetchConfigurableVariants();
      return;
    }

    await addSimpleProduct();
  };

  const handleQtyDelta = async (
    event: React.MouseEvent<HTMLButtonElement>,
    delta: number
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!supportsDirectQuantity || isOutOfStock || qtyBusy) return;

    const line = cartLineForSku;
    if (delta < 0 && !line) return;

    setQtyBusy(true);
    try {
      if (delta > 0) {
        if (line) {
          await updateItemQty(line.item_id, line.qty + 1);
        } else {
          await addItemToCart(
            { sku: product.sku, qty: 1 },
            { openCartOnSuccess: false }
          );
        }
      } else if (line && delta < 0) {
        if (line.qty <= 1) {
          await removeFromCart(line.item_id);
        } else {
          await updateItemQty(line.item_id, line.qty - 1);
        }
      }
    } finally {
      setQtyBusy(false);
    }
  };

  const productHref = `/products/${encodeURIComponent(
    product.urlKey ?? product.sku
  )}` as Route;

  const promotionBadge =
    cpLabel && cpLabelColor ? (
      <span
        className="max-w-[85%] truncate rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{
          backgroundColor: cpLabelColor,
          color: contrastForegroundForBackground(cpLabelColor),
        }}
      >
        {cpLabel}
      </span>
    ) : cpLabel ? (
      <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink">
        {cpLabel}
      </span>
    ) : product.promotionLabel ? (
      <span className="rounded-md bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-foreground">
        {product.promotionLabel}
      </span>
    ) : hasDiscount ? (
      <span className="rounded-md bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-foreground">
        Sale
      </span>
    ) : null;

  const showStepper =
    supportsDirectQuantity &&
    !isOutOfStock &&
    cartQty > 0 &&
    typeKey !== 'configurable';

  return (
    <>
      <article className="flex flex-col rounded-2xl bg-background p-2">
        <Link href={productHref} className="flex min-h-0 flex-1 flex-col">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
            {imageUrl && !imageLoadFailed ? (
              <Image
                src={imageUrl}
                alt={product.displayName}
                fill
                className={`object-cover ${
                  isOutOfStock ? 'opacity-60 grayscale' : ''
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
                onError={() => setImageLoadFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-muted/30">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-col gap-1">
              {isOutOfStock ? (
                <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Sold out
                </span>
              ) : (
                promotionBadge
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col px-2 pb-3 pt-3">
            <p className="mb-2 line-clamp-2 text-sm font-semibold text-ink leading-snug">
              {product.displayName}
            </p>

            {hasRating ? (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <StarRating percentage={product.ratingPercentage ?? 0} />
                <span className="text-xs font-medium text-ink">
                  {ratingScore.toFixed(1)}
                </span>
                <span className="text-xs text-ink-muted">
                  ({product.reviewCount})
                </span>
              </div>
            ) : (
              <div className="mb-2 h-4" />
            )}

            <div className="mt-auto flex flex-wrap items-baseline gap-2">
              {priceValue != null ? (
                <>
                  {hasDiscount && (
                    <span className="text-xs font-medium text-ink-muted line-through">
                      {formatPrice(originalPrice ?? 0, currencyCode)}
                    </span>
                  )}
                  <span className="text-base font-bold text-ink">
                    {formatPrice(priceValue, currencyCode)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-ink-muted">
                  Price unavailable
                </span>
              )}
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-2 px-2 pb-2">
          {showStepper && (
            <div className="flex items-center justify-center gap-3 rounded-full bg-surface-muted/80 px-2 py-2">
              <button
                type="button"
                onClick={e => void handleQtyDelta(e, -1)}
                disabled={qtyBusy || isAdding}
                aria-label="Decrease quantity"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-ink shadow-sm transition hover:bg-surface disabled:opacity-50"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span
                className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-ink"
                aria-live="polite"
              >
                {cartQty}
              </span>
              <button
                type="button"
                onClick={e => void handleQtyDelta(e, 1)}
                disabled={qtyBusy || isAdding}
                aria-label="Increase quantity"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-ink shadow-sm transition hover:bg-surface disabled:opacity-50"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}

          {!showStepper && (
            <button
              type="button"
              onClick={e => void handlePrimaryAction(e)}
              disabled={isOutOfStock || isAdding || quickViewLoading}
              aria-busy={isAdding || quickViewLoading}
              aria-label={
                typeKey === 'configurable'
                  ? 'Select options'
                  : isOutOfStock
                  ? 'Sold out'
                  : 'Add to cart'
              }
              className={`relative w-full rounded-full py-3 text-center text-xs font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60 ${
                isOutOfStock
                  ? 'bg-surface-muted text-ink-muted'
                  : 'bg-brand text-brand-foreground'
              }`}
            >
              {isOutOfStock
                ? 'Sold out'
                : typeKey === 'configurable'
                ? quickViewLoading
                  ? 'Loading…'
                  : `Select options${cartQty > 0 ? ` (${cartQty})` : ''}`
                : isAdding
                ? 'Adding…'
                : 'Add to cart'}
            </button>
          )}

          {addError && (
            <p className="text-center text-xs text-red-600">{addError}</p>
          )}
        </div>
      </article>

      {isQuickViewOpen && (
        <QuickAddModal
          product={product}
          variantData={
            quickViewData ?? {
              options: [],
              customizable_options: [],
              variants: [],
            }
          }
          error={quickViewError}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
    </>
  );
}
