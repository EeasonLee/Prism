'use client';

import type { Route } from 'next';
import { OptimizedImage } from '@prism/ui';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { cn } from '@prism/shared';
import type { UnifiedProductDisplay } from '../types';
import { useCart, useAddToCartAction, applyCoupon } from '@/features/cart';
import { readClaimedCoupons } from '../hooks/use-coupon-claim';
import { buildProductUrl } from '../services/product-navigation';
import { computeDiscountPercent } from '../services/display-mapper';
import { stripHtml } from '../services/html-utils';
import { QuickAddModal } from './QuickAddModal';
import { ProductLabel } from './ProductLabel';
import { ProductPrice } from './ProductPrice';
import { AddToCartButton } from './AddToCartButton';

// ─── 类型 ──────────────────────────────────────────────────────────────────────

export type ProductCardVariant =
  | 'default'
  | 'compact'
  | 'grid'
  | 'deal'
  | 'category'
  | 'featured';

interface ProductCardProps {
  product: UnifiedProductDisplay;
  variant?: ProductCardVariant;
  /** 外层容器 className，用于调用方覆盖特定样式 */
  className?: string;
  /** 来源分类 slug，写入链接 ?from= 参数，用于商品详情页面包屑 */
  fromCategory?: string;
  /** GTM select_item callback */
  onClick?: () => void;
}

// ─── 星标组件 ──────────────────────────────────────────────────────────────────

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

function StarRating({ percentage }: { percentage: number }) {
  const score = (percentage / 100) * 5;
  const fullStars = Math.floor(score);
  const fraction = score - fullStars;
  const hasHalf = fraction >= 0.25 && fraction < 0.75;
  const reactId = useId();
  const clipId = `star-half-${reactId}`;

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

// ─── Default 变体 ─────────────────────────────────────────────────────────────

function ProductCardDefault({
  product,
  imageUrl,
  isOutOfStock,
  discountPercent,
  cartQty,
  isAdding,
  qtyBusy,
  addError,
  handlePrimaryAction,
  handleQtyDelta,
  showStepper,
  productHref,
  hasRating,
  ratingScore,
  labelProps,
}: {
  product: UnifiedProductDisplay;
  imageUrl: string | null;
  isOutOfStock: boolean;
  discountPercent: number | null;
  cartQty: number;
  isAdding: boolean;
  qtyBusy: boolean;
  addError: string | null;
  handlePrimaryAction: (
    e: React.MouseEvent<HTMLButtonElement>
  ) => Promise<void>;
  handleQtyDelta: (
    e: React.MouseEvent<HTMLButtonElement>,
    delta: number
  ) => Promise<void>;
  showStepper: boolean;
  productHref: Route;
  hasRating: boolean;
  ratingScore: number;
  labelProps: {
    isInStock: boolean;
    discountPercent: number | null;
    bestText: string | null;
    bestColor: string | null;
    cpLabel: string | null;
    cpLabelColor: string | null;
    cpPrice: number | null;
    cpStartsAt: string | null;
    cpExpiresAt: string | null;
    currency: string;
  };
}) {
  const typeKey = product.type_id;
  const isConfigurable = typeKey === 'configurable';

  return (
    <article className="flex flex-col rounded-2xl bg-background p-2">
      <Link href={productHref} className="flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
          <OptimizedImage
            src={imageUrl}
            alt={product.short_name ?? product.name}
            fill
            className="object-cover"
            maxDisplayWidth={350}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />

          <ProductLabel
            {...labelProps}
            className="pointer-events-none absolute left-2 top-2 max-w-[calc(100%-1rem)]"
          />
        </div>

        <div className="flex flex-1 flex-col px-2 pb-3 pt-3">
          <p className="mb-2 min-h-[2.375rem] line-clamp-2 text-sm font-semibold leading-snug text-ink">
            {product.short_name ?? product.name}
          </p>

          {hasRating ? (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <StarRating percentage={product.rating_summary ?? 0} />
              <span className="text-xs font-medium text-ink">
                {ratingScore.toFixed(1)}
              </span>
              <span className="text-xs text-ink-muted">
                ({product.review_count})
              </span>
            </div>
          ) : (
            <div className="mb-2 h-4" />
          )}

          <div className="mt-auto">
            {product.final_price > 0 ? (
              <ProductPrice
                price={product.price}
                finalPrice={product.final_price}
                discountPercent={discountPercent}
                currency={product.currency ?? 'USD'}
                size="md"
              />
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
          <div className="flex h-10 items-center justify-center gap-2.5 rounded-full bg-surface-muted/80 px-2">
            <button
              type="button"
              onClick={e => void handleQtyDelta(e, -1)}
              disabled={qtyBusy || isAdding}
              aria-label="Decrease quantity"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-ink shadow-sm transition hover:bg-surface disabled:opacity-50"
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-ink shadow-sm transition hover:bg-surface disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}

        {!showStepper && (
          <button
            type="button"
            onClick={e => void handlePrimaryAction(e)}
            disabled={isOutOfStock || isAdding}
            aria-label={
              isConfigurable
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
              : isConfigurable
              ? `Select options${cartQty > 0 ? ` (${cartQty})` : ''}`
              : isAdding
              ? 'Adding…'
              : 'Add to cart'}
          </button>
        )}

        {addError && (
          <div
            role="alert"
            className="flex items-start gap-1.5 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            <span>{addError}</span>
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Compact 变体（原 ProductCardCompact）─────────────────────────────────────

function ProductCardCompactVariant({
  product,
  imageUrl,
  isOutOfStock,
  discountPercent,
  productHref,
  isAdding,
  handleAddToCart,
  labelProps,
  className,
}: {
  product: UnifiedProductDisplay;
  imageUrl: string | null;
  isOutOfStock: boolean;
  discountPercent: number | null;
  productHref: Route;
  isAdding: boolean;
  handleAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  labelProps: {
    isInStock: boolean;
    discountPercent: number | null;
    bestText: string | null;
    bestColor: string | null;
    cpLabel: string | null;
    cpLabelColor: string | null;
    cpPrice: number | null;
    cpStartsAt: string | null;
    cpExpiresAt: string | null;
    currency: string;
  };
  className?: string;
}) {
  return (
    <Link
      href={productHref}
      className={cn(
        'group isolate cursor-pointer overflow-hidden rounded-xl border border-border bg-white transition-all duration-300 will-change-transform hover:-translate-y-0.5 hover:shadow-card',
        className
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface">
        <OptimizedImage
          src={imageUrl}
          alt={product.short_name ?? product.name}
          fill
          maxDisplayWidth={230}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <ProductLabel
          {...labelProps}
          className="pointer-events-none absolute left-2.5 top-2.5"
        />

        {!isOutOfStock && (
          <button
            type="button"
            className="absolute right-2.5 top-2.5 flex h-8 w-8 -translate-y-1 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-brand hover:text-white disabled:pointer-events-none"
            aria-label="Add to cart"
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold leading-tight text-white">
            {product.short_name ?? product.name}
          </h3>
          <div className="mt-1.5">
            {product.final_price > 0 ? (
              <ProductPrice
                price={product.price}
                finalPrice={product.final_price}
                discountPercent={discountPercent}
                currency={product.currency ?? 'USD'}
                size="sm"
                className="[&_.selling-price]:text-white [&_.original-price]:text-white/50"
              />
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Grid 变体（轮播/网格布局专用）────────────────────────────────────────────

function ProductCardGridVariant({
  product,
  imageUrl,
  isOutOfStock,
  discountPercent,
  productHref,
  isAdding,
  handleAddToCart,
  labelProps,
}: {
  product: UnifiedProductDisplay;
  imageUrl: string | null;
  isOutOfStock: boolean;
  discountPercent: number | null;
  productHref: Route;
  isAdding: boolean;
  handleAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  labelProps: {
    isInStock: boolean;
    discountPercent: number | null;
    bestText: string | null;
    bestColor: string | null;
    cpLabel: string | null;
    cpLabelColor: string | null;
    cpPrice: number | null;
    cpStartsAt: string | null;
    cpExpiresAt: string | null;
    currency: string;
  };
}) {
  return (
    <article className="overflow-hidden bg-white">
      <Link href={productHref} className="block">
        {/* 图片即板块 — 独立圆角 + 浅灰底色 */}
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-muted">
          <OptimizedImage
            src={imageUrl}
            alt={product.short_name ?? product.name}
            fill
            maxDisplayWidth={360}
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          <ProductLabel
            {...labelProps}
            className="pointer-events-none absolute left-2 top-2"
          />

          {/* 右下角浮动加购图标 */}
          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              aria-label="Add to cart"
              className="absolute right-2 bottom-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-md transition hover:bg-brand hover:text-white disabled:pointer-events-none"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* 纯色背景文案区 */}
        <div className="pt-2 pb-3">
          <h3 className="line-clamp-2 text-sm font-medium text-ink">
            {product.short_name ?? product.name}
          </h3>
          <div className="mt-1">
            {product.final_price > 0 ? (
              <ProductPrice
                price={product.price}
                finalPrice={product.final_price}
                discountPercent={discountPercent}
                currency={product.currency ?? 'USD'}
                size="sm"
              />
            ) : (
              <span className="text-xs text-ink-muted">Price unavailable</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

// ─── Deal 变体（原 DealProductCard）───────────────────────────────────────────

function ProductCardDealVariant({
  product,
  imageUrl,
  isOutOfStock,
  discountPercent,
  productHref,
  labelProps,
}: {
  product: UnifiedProductDisplay;
  imageUrl: string | null;
  isOutOfStock: boolean;
  discountPercent: number | null;
  productHref: Route;
  labelProps: {
    isInStock: boolean;
    discountPercent: number | null;
    bestText: string | null;
    bestColor: string | null;
    cpLabel: string | null;
    cpLabelColor: string | null;
    cpPrice: number | null;
    cpStartsAt: string | null;
    cpExpiresAt: string | null;
    currency: string;
  };
}) {
  const isDirectAddSupported =
    product.type_id === 'simple' || product.type_id === 'virtual';
  const addDisabled = isOutOfStock || !isDirectAddSupported;
  const disabledLabel = isOutOfStock ? 'Out of Stock' : 'Select Options';

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <Link href={productHref} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface">
          <OptimizedImage
            src={imageUrl}
            alt={product.short_name ?? product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            maxDisplayWidth={350}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">
                Out of Stock
              </span>
            </div>
          )}

          <ProductLabel
            {...labelProps}
            className="pointer-events-none absolute left-2 top-2"
          />
        </div>

        <div className="p-3 pb-2">
          <h3 className="line-clamp-2 text-sm font-medium text-ink group-hover:text-brand">
            {product.short_name ?? product.name}
          </h3>
          <div className="mt-1.5">
            {product.final_price > 0 ? (
              <ProductPrice
                price={product.price}
                finalPrice={product.final_price}
                discountPercent={discountPercent}
                currency={product.currency ?? 'USD'}
                size="sm"
              />
            ) : (
              <span className="text-xs text-ink-muted">Price unavailable</span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3">
        <AddToCartButton
          sku={product.sku}
          qty={1}
          disabled={addDisabled}
          disabledLabel={disabledLabel}
          className="btn-primary flex h-9 w-full items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </article>
  );
}

// ─── Category 变体（原 CategoryProductCard）───────────────────────────────────

function ProductCardCategoryVariant({
  product,
  imageUrl,
  discountPercent,
  productHref,
  labelProps,
}: {
  product: UnifiedProductDisplay;
  imageUrl: string | null;
  discountPercent: number | null;
  productHref: Route;
  labelProps: {
    isInStock: boolean;
    discountPercent: number | null;
    bestText: string | null;
    bestColor: string | null;
    cpLabel: string | null;
    cpLabelColor: string | null;
    cpPrice: number | null;
    cpStartsAt: string | null;
    cpExpiresAt: string | null;
    currency: string;
  };
}) {
  const hasRating = (product.rating_summary ?? 0) > 0;

  return (
    <article className="overflow-hidden rounded-xl bg-white">
      <Link
        href={productHref}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <div className="group/image relative aspect-square overflow-hidden rounded-xl bg-white">
          <OptimizedImage
            src={imageUrl}
            alt={product.short_name ?? product.name}
            fill
            className="object-contain p-3 transition-transform duration-500 group-hover/image:scale-105"
            maxDisplayWidth={350}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />

          <ProductLabel
            {...labelProps}
            className="pointer-events-none absolute left-2 top-2"
          />
        </div>

        <div className="px-1 pb-1 pt-3">
          <h3 className="line-clamp-2 min-h-12 text-base font-medium leading-6 text-ink">
            {product.short_name ?? product.name}
          </h3>

          {hasRating && (
            <div className="mt-2 flex items-center gap-1.5">
              <StarRating percentage={product.rating_summary ?? 0} />
              <span className="text-sm font-medium text-ink">
                {((product.rating_summary ?? 0) / 20).toFixed(1)}
              </span>
              <span className="text-xs text-ink-muted">
                ({product.review_count})
              </span>
            </div>
          )}

          <div className="mt-2">
            {product.final_price > 0 ? (
              <ProductPrice
                price={product.price}
                finalPrice={product.final_price}
                discountPercent={discountPercent}
                currency={product.currency ?? 'USD'}
                size="lg"
              />
            ) : (
              <span className="text-base font-medium text-ink-muted">
                Price unavailable
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

// ─── Featured 变体（原 FeaturedProductCard）───────────────────────────────────

function ProductCardFeaturedVariant({
  product,
  imageUrl,
  discountPercent,
  productHref,
  labelProps,
}: {
  product: UnifiedProductDisplay;
  imageUrl: string | null;
  discountPercent: number | null;
  productHref: Route;
  labelProps: {
    isInStock: boolean;
    discountPercent: number | null;
    bestText: string | null;
    bestColor: string | null;
    cpLabel: string | null;
    cpLabelColor: string | null;
    cpPrice: number | null;
    cpStartsAt: string | null;
    cpExpiresAt: string | null;
    currency: string;
  };
}) {
  // 从 short_description HTML 提取卖点；longtitle 可能含 HTML，统一做 strip
  const cleanLongTitle = useMemo(
    () => stripHtml(product.longtitle) || null,
    [product.longtitle]
  );
  const sellingPoints = useMemo(() => {
    if (!product.short_description) return [];
    const liMatches = [
      ...product.short_description.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi),
    ];
    return liMatches
      .map(match => stripHtml(match[1]))
      .filter(Boolean)
      .slice(0, 3);
  }, [product.short_description]);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-white">
      <Link
        href={productHref}
        className="absolute inset-0 z-[1]"
        aria-label={product.short_name ?? product.name}
      />

      <div className="grid grid-cols-1 items-start md:grid-cols-[1fr,2fr] md:items-stretch">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden">
          <OptimizedImage
            src={imageUrl}
            alt={product.short_name ?? product.name}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            maxDisplayWidth={280}
            sizes="(max-width: 640px) 100vw, 280px"
          />

          <ProductLabel
            {...labelProps}
            className="pointer-events-none absolute left-3 top-3"
          />
        </div>

        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col justify-between p-4 lg:p-6">
          <div className="min-w-0 flex-1 overflow-hidden">
            <h3
              className="mb-2 line-clamp-2 text-base font-bold leading-snug text-ink lg:text-xl"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              {product.short_name ?? product.name}
            </h3>
            {cleanLongTitle && (
              <p className="mb-3 hidden line-clamp-2 text-sm text-ink-muted md:block">
                {cleanLongTitle}
              </p>
            )}
            {sellingPoints.length > 0 && (
              <ul className="mb-5 hidden min-w-0 space-y-1.5 overflow-hidden text-xs text-ink-muted md:block lg:text-sm">
                {sellingPoints.map(point => (
                  <li
                    key={`${product.sku}-${point}`}
                    className="relative min-w-0 pl-4 before:absolute before:left-0 before:top-1/2 before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-brand/35"
                  >
                    <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            {product.final_price > 0 && (
              <div className="mb-4">
                <ProductPrice
                  price={product.price}
                  finalPrice={product.final_price}
                  discountPercent={discountPercent}
                  currency={product.currency ?? 'USD'}
                  size="lg"
                  showSaveBadge
                  sellingPriceClassName="text-brand"
                />
              </div>
            )}

            <span className="relative z-10" onClick={e => e.stopPropagation()}>
              <AddToCartButton
                sku={product.sku}
                className="btn-primary flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 lg:px-5"
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 统一 ProductCard ─────────────────────────────────────────────────────────

export function ProductCard({
  product,
  variant = 'default',
  className,
  fromCategory,
  onClick,
}: ProductCardProps) {
  const { items, getQtyBySku, updateItemQty, removeFromCart, syncCart } =
    useCart();
  const {
    addItemToCart,
    isAdding,
    error: addError,
    clearError,
  } = useAddToCartAction();
  const isOutOfStock = !product.is_in_stock;
  const typeKey = product.type_id;
  const supportsDirectQuantity = typeKey === 'simple' || typeKey === 'virtual';

  // ── 图片（透传原始 URL，由 OptimizedImage 统一处理）──
  const imageUrl = product.image?.trim() ?? null;
  // ── 折扣 ──
  const discountPercent =
    product.discount_percent ??
    computeDiscountPercent(product.price, product.final_price);

  // ── 标签公共 props（各变体 ProductLabel 共用）──
  const labelProps = useMemo(
    () => ({
      isInStock: product.is_in_stock,
      discountPercent,
      bestText: product.best_text,
      bestColor: product.best_color,
      cpLabel: product.cp_label,
      cpLabelColor: product.cp_label_color,
      cpPrice: product.cp_price,
      cpStartsAt: product.cp_starts_at,
      cpExpiresAt: product.cp_expires_at,
      currency: product.currency ?? 'USD',
    }),
    [product, discountPercent]
  );

  // ── 购物车数量 ──
  const cartQty = useMemo(() => {
    if (typeKey === 'configurable' && product.variant_data) {
      const variantSkuSet = new Set([
        product.sku,
        ...product.variant_data.variants.map(v => v.sku),
      ]);
      return items.reduce((sum, item) => {
        if (!variantSkuSet.has(item.sku)) return sum;
        return sum + item.qty;
      }, 0);
    }
    return getQtyBySku(product.sku);
  }, [typeKey, product.variant_data, product.sku, items, getQtyBySku]);

  const cartLineForSku = useMemo(
    () => items.find(item => item.sku === product.sku),
    [items, product.sku]
  );

  const isCouponValid = useMemo(() => {
    if (!product.cp_code) return false;
    const now = Date.now();
    if (product.cp_starts_at) {
      const startMs = new Date(product.cp_starts_at).getTime();
      if (Number.isFinite(startMs) && now < startMs) return false;
    }
    if (product.cp_expires_at) {
      const endMs = new Date(product.cp_expires_at).getTime();
      if (Number.isFinite(endMs) && now > endMs) return false;
    }
    return true;
  }, [product.cp_code, product.cp_starts_at, product.cp_expires_at]);

  // ── 跨页面已领取优惠券 ──
  const claimedCouponCode = useMemo(() => {
    const claimed = readClaimedCoupons();
    return claimed[product.sku] ?? null;
  }, [product.sku]);

  // ── 实际使用的优惠券码：已领取的优先，其次产品数据自带的 ──
  const effectiveCouponCode =
    claimedCouponCode ?? (isCouponValid ? product.cp_code : null) ?? null;

  // ── 操作 ──
  const addSimpleProduct = async () => {
    await addItemToCart(
      { sku: product.sku, qty: 1 },
      { openCartOnSuccess: true }
    );
    if (effectiveCouponCode) {
      try {
        await applyCoupon(effectiveCouponCode);
        await syncCart();
      } catch {
        // 静默忽略
      }
    }
  };

  const [qtyBusy, setQtyBusy] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quickViewData, setQuickViewData] = useState<
    Parameters<typeof QuickAddModal>[0]['variantData'] | null
  >(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [quickViewError, setQuickViewError] = useState<string | null>(null);

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
          if (effectiveCouponCode) {
            try {
              await applyCoupon(effectiveCouponCode);
              await syncCart();
            } catch {
              /* ignore */
            }
          }
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

  const handleCompactAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding || isOutOfStock) return;
    void (async () => {
      const success = await addItemToCart(
        { sku: product.sku, qty: 1 },
        { openCartOnSuccess: true }
      );
      if (success && effectiveCouponCode) {
        try {
          await applyCoupon(effectiveCouponCode);
          await syncCart();
        } catch {
          /* ignore */
        }
      }
    })();
  };

  const productHref = buildProductUrl(
    {
      url_key: product.url_key,
      sku: product.sku,
      cp_code: null,
    },
    fromCategory ? { fromCategory } : undefined
  ) as Route;

  const showStepper = supportsDirectQuantity && !isOutOfStock && cartQty > 0;

  const hasRating = (product.rating_summary ?? 0) > 0;
  const ratingScore = ((product.rating_summary ?? 0) / 100) * 5;

  // ── 变体分发 ──
  switch (variant) {
    case 'compact':
      return (
        <div onClick={onClick}>
          <ProductCardCompactVariant
            product={product}
            imageUrl={imageUrl}
            isOutOfStock={isOutOfStock}
            discountPercent={discountPercent}
            productHref={productHref}
            isAdding={isAdding}
            handleAddToCart={handleCompactAdd}
            labelProps={labelProps}
            className={className}
          />
        </div>
      );

    case 'grid':
      return (
        <div onClick={onClick}>
          <ProductCardGridVariant
            product={product}
            imageUrl={imageUrl}
            isOutOfStock={isOutOfStock}
            discountPercent={discountPercent}
            productHref={productHref}
            isAdding={isAdding}
            handleAddToCart={handleCompactAdd}
            labelProps={labelProps}
          />
        </div>
      );

    case 'deal':
      return (
        <div onClick={onClick}>
          <ProductCardDealVariant
            product={product}
            imageUrl={imageUrl}
            isOutOfStock={isOutOfStock}
            discountPercent={discountPercent}
            productHref={productHref}
            labelProps={labelProps}
          />
        </div>
      );

    case 'category':
      return (
        <div onClick={onClick}>
          <ProductCardCategoryVariant
            product={product}
            imageUrl={imageUrl}
            discountPercent={discountPercent}
            productHref={productHref}
            labelProps={labelProps}
          />
        </div>
      );

    case 'featured':
      return (
        <div onClick={onClick}>
          <ProductCardFeaturedVariant
            product={product}
            imageUrl={imageUrl}
            discountPercent={discountPercent}
            productHref={productHref}
            labelProps={labelProps}
          />
        </div>
      );

    default:
      return (
        <div onClick={onClick}>
          <ProductCardDefault
            product={product}
            imageUrl={imageUrl}
            isOutOfStock={isOutOfStock}
            discountPercent={discountPercent}
            cartQty={cartQty}
            isAdding={isAdding}
            qtyBusy={qtyBusy}
            addError={addError}
            handlePrimaryAction={handlePrimaryAction}
            handleQtyDelta={handleQtyDelta}
            showStepper={showStepper}
            productHref={productHref}
            hasRating={hasRating}
            ratingScore={ratingScore}
            labelProps={labelProps}
          />

          {isQuickViewOpen && (
            <QuickAddModal
              product={{
                sku: product.sku,
                displayName: product.short_name ?? product.name,
                name: product.name,
                image: product.image,
                price: {
                  value: product.final_price,
                  currency: product.currency ?? 'USD',
                },
                originalPrice: product.price,
                urlKey: product.url_key,
                type: product.type_id as 'simple' | 'configurable' | 'virtual',
                inStock: product.is_in_stock,
                shortName: product.short_name,
                longTitle: product.longtitle,
                shortDescription: product.short_description,
                ratingPercentage: product.rating_summary ?? 0,
                reviewCount: product.review_count,
                promotionLabel: product.best_text,
                cpLabel: product.cp_label,
                cpLabelColor: product.cp_label_color,
              }}
              variantData={
                quickViewData ?? {
                  options: [],
                  customizable_options: [],
                  variants: [],
                }
              }
              couponCode={effectiveCouponCode}
              error={quickViewError}
              onClose={() => setIsQuickViewOpen(false)}
            />
          )}
        </div>
      );
  }
}
