'use client';

import { useEffect, useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useAuthModal } from '@/features/auth';
import {
  ProductDetailClient,
  type ProductDetailSelection,
} from './ProductDetailClient';
import { ProductImageGallery } from './ProductImageGallery';
import { ShareTrigger } from '@/app/_ui/share';
import {
  normalizeCpPrice,
  computeDiscountPercent,
  CouponBanner,
} from '@/features/product';
import type { UnifiedProduct, UnifiedProductImage } from '@/features/product';
import type { ShareTarget } from '@/app/_ui/share';
import { ExpandableHtmlSections } from './ExpandableHtmlSections';
import { parseHtmlIntoSections } from './parse-html-sections';

interface ProductDetailContentProps {
  product: UnifiedProduct;
  galleryImages: UnifiedProductImage[];
  ratingPercentage: number;
  ratingCount: number;
  selection: ProductDetailSelection;
  onSelectionChange: (selection: ProductDetailSelection) => void;
  onWriteReview: () => void;
  shareTarget?: ShareTarget;
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

function StarRating({
  percentage,
  count,
  onNavigateToReviews,
  onWriteReview,
}: {
  percentage: number;
  count: number;
  onNavigateToReviews: () => void;
  onWriteReview: () => void;
}) {
  const averageRating = Math.max(0, Math.min(5, percentage / 20));
  const countText = count.toLocaleString();

  return (
    <div className="flex items-center gap-3 leading-none">
      <button
        type="button"
        onClick={onNavigateToReviews}
        className="inline-flex items-center gap-2 rounded-md text-sm leading-none text-ink-muted transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        aria-label="Go to customer reviews"
      >
        <div className="relative flex gap-0.5" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              className="h-4 w-4 text-ink-muted/25"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d={STAR_PATH} />
            </svg>
          ))}
          <div
            className="absolute inset-0 flex gap-0.5 overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                className="h-4 w-4 shrink-0 text-amber-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d={STAR_PATH} />
              </svg>
            ))}
          </div>
        </div>
        <span className="text-sm leading-none text-ink-muted">
          {averageRating.toFixed(1)} ({countText})
        </span>
      </button>

      <button
        type="button"
        onClick={onWriteReview}
        className="text-sm font-medium leading-none text-ink transition hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Write a review
      </button>
    </div>
  );
}

export function ProductDetailContent({
  product,
  galleryImages,
  ratingPercentage,
  ratingCount,
  selection,
  onSelectionChange,
  onWriteReview,
  shareTarget,
}: ProductDetailContentProps) {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [pendingWishlist, setPendingWishlist] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<number | null>(null);

  // Check if current product is already in wishlist
  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistItemId(null);
      return;
    }
    let cancelled = false;
    fetch('/api/v1/account/wishlist', { method: 'GET', credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then((data: { items?: Array<{ id: number; sku: string }> } | null) => {
        if (cancelled || !data) return;
        const found = data.items?.find(item => item.sku === product.sku);
        setWishlistItemId(found?.id ?? null);
      })
      .catch(() => {
        // silently ignore
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, product.sku]);

  const doToggleWishlist = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    setWishlistError(null);
    try {
      if (wishlistItemId != null) {
        // Remove
        const res = await fetch(`/api/v1/account/wishlist/${wishlistItemId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: { message?: string } };
          throw new Error(
            data.error?.message ?? 'Failed to remove from wishlist'
          );
        }
        setWishlistItemId(null);
      } else {
        // Add
        const res = await fetch('/api/v1/account/wishlist', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sku: product.sku }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: { message?: string } };
          throw new Error(data.error?.message ?? 'Failed to add to wishlist');
        }
        const result = (await res.json()) as { id?: number } | undefined;
        if (result?.id != null) {
          setWishlistItemId(result.id);
        } else {
          // fallback: re-fetch to get the new item id
          const listRes = await fetch('/api/v1/account/wishlist', {
            method: 'GET',
            credentials: 'include',
          });
          const listData = (await listRes.json()) as {
            items?: Array<{ id: number; sku: string }>;
          };
          const found = listData.items?.find(item => item.sku === product.sku);
          setWishlistItemId(found?.id ?? null);
        }
        setWishlistAdded(true);
        setTimeout(() => setWishlistAdded(false), 2000);
      }
    } catch (err) {
      setWishlistError(
        err instanceof Error ? err.message : 'Wishlist action failed'
      );
      setTimeout(() => setWishlistError(null), 3000);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      setPendingWishlist(true);
      openLogin('signin');
      return;
    }
    await doToggleWishlist();
  };

  useEffect(() => {
    if (isAuthenticated && pendingWishlist) {
      setPendingWishlist(false);
      void doToggleWishlist();
    }
  }, [isAuthenticated, pendingWishlist]);
  const specificationSections = useMemo(
    () => parseHtmlIntoSections(product.specifications),
    [product.specifications]
  );

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  const debugCoupon =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debugCoupon') === '1';

  const parseCouponDateMs = (raw: string | null | undefined): number | null => {
    const trimmed = raw?.trim();
    if (!trimmed) return null;

    // Magento often returns "YYYY-MM-DD HH:mm:ss" (non-ISO). Convert to ISO-ish.
    const isoCandidate = trimmed.includes('T')
      ? trimmed
      : trimmed.replace(' ', 'T');

    const ms = new Date(isoCandidate).getTime();
    return Number.isFinite(ms) ? ms : null;
  };

  const useVariantHeadline =
    product.type_id === 'configurable' &&
    selection.allSelected &&
    selection.selectedVariant != null;

  const displayTitle = useMemo(() => {
    if (useVariantHeadline && selection.selectedVariant?.name) {
      return selection.selectedVariant.name;
    }
    return product.display_name;
  }, [product.display_name, selection.selectedVariant, useVariantHeadline]);

  const parsedCpPrice = useMemo(
    () =>
      normalizeCpPrice(
        useVariantHeadline
          ? selection.selectedVariant?.cp_price
          : product.cp_price
      ),
    [product.cp_price, selection.selectedVariant, useVariantHeadline]
  );

  const displayProduct = useMemo(() => {
    const selectedVariant = selection.selectedVariant;
    const hasCompleteVariantSelection =
      product.type_id !== 'configurable' || selection.allSelected;
    const customOptionPriceDelta = selection.customOptionPriceDelta ?? 0;
    const basePrice = hasCompleteVariantSelection
      ? selectedVariant?.price ?? product.price
      : product.price;
    const baseSpecialPrice = hasCompleteVariantSelection
      ? selectedVariant?.special_price ?? product.special_price
      : product.special_price;

    const imageAltFallback = displayTitle;

    return {
      sku: hasCompleteVariantSelection
        ? selectedVariant?.sku ?? product.sku
        : product.sku,
      price: basePrice + customOptionPriceDelta,
      specialPrice:
        baseSpecialPrice != null
          ? baseSpecialPrice + customOptionPriceDelta
          : null,
      stockQty: hasCompleteVariantSelection
        ? selectedVariant?.stock_qty ?? product.stock_qty
        : product.stock_qty,
      isInStock: hasCompleteVariantSelection
        ? selectedVariant?.is_in_stock ?? product.is_in_stock ?? false
        : product.is_in_stock ?? false,
      images:
        hasCompleteVariantSelection &&
        (selectedVariant?.media_gallery?.length ?? 0) > 0
          ? selectedVariant?.media_gallery?.map(image => ({
              url: image.url,
              alt: image.label ?? imageAltFallback,
            })) ?? galleryImages
          : galleryImages,
    };
  }, [displayTitle, galleryImages, product, selection]);

  const hasDiscount =
    displayProduct.specialPrice != null &&
    displayProduct.specialPrice < displayProduct.price;

  const effectiveCpCode = useVariantHeadline
    ? selection.selectedVariant?.cp_code ?? null
    : product.cp_code ?? null;
  const effectiveCpDate = useVariantHeadline
    ? selection.selectedVariant?.cp_date ?? null
    : product.cp_date ?? null;

  const cpCode = effectiveCpCode;
  const cpDateMs = parseCouponDateMs(effectiveCpDate);
  const isCouponExpired =
    cpDateMs != null && nowMs != null ? cpDateMs < nowMs : false;

  const displayPromotionLabel = useMemo(() => {
    if (useVariantHeadline && selection.selectedVariant) {
      const label = selection.selectedVariant.cp_label ?? null;
      if (label == null) return null;
      const variantDateMs = parseCouponDateMs(
        selection.selectedVariant.cp_date ?? undefined
      );
      const expired =
        variantDateMs != null && nowMs != null ? variantDateMs < nowMs : false;
      return !expired ? label : null;
    }
    return product.promotion_label;
  }, [
    nowMs,
    product.promotion_label,
    selection.selectedVariant,
    useVariantHeadline,
  ]);

  const showCouponBanner =
    typeof cpCode === 'string' && cpCode.trim().length > 0 && !isCouponExpired;

  const priceBeforeCoupon =
    displayProduct.specialPrice != null && hasDiscount
      ? displayProduct.specialPrice
      : displayProduct.price;

  const currencyCode = useMemo(() => {
    const code = product.currency?.trim().toUpperCase();
    return code && code.length === 3 ? code : 'USD';
  }, [product.currency]);

  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return (value: number) => formatter.format(value);
  }, [currencyCode]);

  const validUntilText =
    cpDateMs != null && !isCouponExpired
      ? new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }).format(new Date(cpDateMs))
      : null;

  const handleGoToReviews = () => {
    const reviewSection = document.getElementById('section-reviews');
    if (!reviewSection) {
      return;
    }

    reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      id="product-main"
      className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start lg:gap-12"
    >
      <div className="lg:sticky lg:top-24 lg:self-start">
        <ProductImageGallery
          images={displayProduct.images}
          productName={displayTitle}
        />
      </div>

      <div className="flex flex-col gap-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              SKU: {displayProduct.sku}
            </span>
            {debugCoupon && (
              <span className="text-[11px] font-medium text-ink-muted">
                [debugCoupon] cp_code={cpCode ?? 'null'}, cp_date=
                {effectiveCpDate ?? 'null'}, cpDateMs={cpDateMs ?? 'null'},
                expired=
                {isCouponExpired ? 'true' : 'false'}, showBanner=
                {showCouponBanner ? 'true' : 'false'}, cp_price=
                {parsedCpPrice ?? 'null'}
              </span>
            )}
            {displayPromotionLabel && !showCouponBanner && (
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-brand-foreground">
                {displayPromotionLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleToggleWishlist()}
              disabled={wishlistLoading}
              aria-label={
                wishlistItemId != null
                  ? 'Remove from wishlist'
                  : 'Add to wishlist'
              }
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface/80 px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-surface-muted disabled:opacity-50"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center transition ${
                  wishlistItemId != null || wishlistAdded
                    ? 'text-red-500'
                    : 'text-ink-muted group-hover:text-ink'
                }`}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    wishlistItemId != null || wishlistAdded
                      ? 'fill-red-500'
                      : ''
                  }`}
                />
              </span>
              {wishlistItemId != null
                ? 'Saved'
                : wishlistAdded
                ? 'Saved'
                : 'Wishlist'}
            </button>
            {shareTarget && (
              <div className="shrink-0">
                <ShareTrigger target={shareTarget} />
              </div>
            )}
          </div>
        </div>
        {wishlistError && (
          <p className="mb-2 text-sm text-red-600">{wishlistError}</p>
        )}
        <h1 className="mb-2 text-2xl font-bold leading-tight text-ink sm:text-3xl">
          {displayTitle}
        </h1>
        {product.subtitle && (
          <p className="mb-3 text-base text-ink-muted">{product.subtitle}</p>
        )}
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {displayProduct.isInStock ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium leading-none text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Item is in stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium leading-none text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Item is out of stock
            </span>
          )}
          {ratingCount > 0 && (
            <StarRating
              percentage={ratingPercentage}
              count={ratingCount}
              onNavigateToReviews={handleGoToReviews}
              onWriteReview={onWriteReview}
            />
          )}
        </div>
        {/* 主价格区：仅展示未使用 cp_code / cp_price 的售价（特价 vs 原价）；券后价只在下方优惠券横幅展示 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {displayProduct.specialPrice != null && (
            <span className="text-2xl font-bold leading-none text-ink">
              {formatPrice(displayProduct.specialPrice)}
            </span>
          )}
          {displayProduct.price > 0 && (
            <span
              className={
                hasDiscount
                  ? 'text-base leading-none text-ink-muted line-through'
                  : 'text-2xl font-bold leading-none text-ink'
              }
            >
              {formatPrice(displayProduct.price)}
            </span>
          )}
          {hasDiscount && (
            <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold leading-none text-brand">
              Save -
              {computeDiscountPercent(
                displayProduct.price,
                displayProduct.specialPrice ?? 0
              )}
              %
            </span>
          )}
        </div>
        {showCouponBanner && (
          <CouponBanner
            cpCode={cpCode}
            cpLabel={displayPromotionLabel}
            cpPrice={parsedCpPrice}
            priceBeforeCoupon={priceBeforeCoupon}
            currency={currencyCode}
            hasDiscount={hasDiscount}
            specialPrice={displayProduct.specialPrice}
            originalPrice={displayProduct.price}
            validUntil={validUntilText}
            variant="pdp"
            className="mb-4"
          />
        )}
        {displayPromotionLabel && !showCouponBanner && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
            <span className="text-sm font-medium text-brand">
              {displayPromotionLabel}
            </span>
            <span className="text-sm text-ink-muted">
              Save big while offer lasts
            </span>
          </div>
        )}
        <ProductDetailClient
          product={product}
          onSelectionChange={onSelectionChange}
        />
        {product.short_description_html ? (
          <div
            className="prose prose-sm mt-4 max-w-none break-words text-ink-muted [&_img]:max-w-full [&_img]:h-auto [&_strong]:font-semibold [&_strong]:text-ink [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
            dangerouslySetInnerHTML={{
              __html: product.short_description_html,
            }}
          />
        ) : product.short_description ? (
          <div
            className="prose prose-sm mt-4 max-w-none break-words text-ink-muted [&_img]:max-w-full [&_img]:h-auto [&_strong]:font-semibold [&_strong]:text-ink [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
            dangerouslySetInnerHTML={{
              __html: product.short_description,
            }}
          />
        ) : null}
        <ExpandableHtmlSections
          sections={specificationSections}
          ariaLabel="Product specifications sections"
        />
      </div>
    </div>
  );
}
