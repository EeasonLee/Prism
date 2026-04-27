'use client';

import { useEffect, useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { useAuthModal } from '@/lib/auth-modal/context';
import {
  ProductDetailClient,
  type ProductDetailSelection,
} from './ProductDetailClient';
import { ProductImageGallery } from './ProductImageGallery';
import { ShareTrigger } from '../../components/share';
import {
  normalizeCpPrice,
  type UnifiedProduct,
  type UnifiedProductImage,
} from '../../../lib/api/unified-product';
import type { ShareTarget } from '../../components/share';

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

interface SpecificationSection {
  title: string;
  contentHtml: string;
}

const SPEC_TITLE_PATTERN = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, '');
}

function decodeCommonEntities(value: string): string {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function normalizeText(value: string): string {
  return decodeCommonEntities(stripTags(value)).replace(/\s+/g, ' ').trim();
}

function parseSpecificationSections(
  specifications: unknown
): SpecificationSection[] {
  if (typeof specifications !== 'string') return [];
  const source = specifications.trim();
  if (!source) return [];

  const headings = Array.from(source.matchAll(SPEC_TITLE_PATTERN));
  if (headings.length === 0) return [];

  return headings
    .map((heading, index) => {
      const headingMarkup = heading[1] ?? '';
      const title = normalizeText(headingMarkup);
      if (!title) return null;

      const start = (heading.index ?? 0) + heading[0].length;
      const end =
        index + 1 < headings.length
          ? headings[index + 1].index ?? source.length
          : source.length;
      const contentHtml = source.slice(start, end).trim();
      const contentText = normalizeText(contentHtml);

      return {
        title,
        contentHtml: contentText ? contentHtml : '<p></p>',
      };
    })
    .filter((section): section is SpecificationSection => section != null);
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

function FireworksIcon() {
  return (
    <svg
      className="h-full w-full text-white/90"
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="6"
        opacity="0.85"
      >
        <path d="M100 20 L100 55" />
        <path d="M100 145 L100 180" />
        <path d="M20 100 L55 100" />
        <path d="M145 100 L180 100" />
        <path d="M35 35 L60 60" />
        <path d="M140 140 L165 165" />
        <path d="M165 35 L140 60" />
        <path d="M60 140 L35 165" />
        <circle cx="100" cy="100" r="9" fill="currentColor" />
      </g>
    </svg>
  );
}

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
  const [showCouponToast, setShowCouponToast] = useState(false);
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
    () => parseSpecificationSections(product.specifications),
    [product.specifications]
  );
  const [expandedSpecificationIndexes, setExpandedSpecificationIndexes] =
    useState<number[]>([]);

  useEffect(() => {
    setExpandedSpecificationIndexes([]);
  }, [specificationSections]);

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
      ? selectedVariant
        ? selectedVariant.special_price ?? null
        : null
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

  const couponOffAmount =
    showCouponBanner && parsedCpPrice != null && parsedCpPrice > 0
      ? Math.min(parsedCpPrice, priceBeforeCoupon)
      : 0;

  const priceAfterCoupon = Math.max(0, priceBeforeCoupon - couponOffAmount);

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

  const handleClaimCoupon = async () => {
    if (!cpCode) return;
    if (typeof navigator === 'undefined') return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(cpCode);
      } else {
        window.prompt('Copy coupon code', cpCode);
      }
    } catch {
      window.prompt('Copy coupon code', cpCode);
    }

    setShowCouponToast(true);
    window.setTimeout(() => {
      setShowCouponToast(false);
    }, 1500);
  };

  return (
    <div
      id="product-main"
      className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12"
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
            {displayPromotionLabel && (
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-surface hover:text-ink disabled:opacity-50"
            >
              <Heart
                className={`h-4 w-4 ${
                  wishlistItemId != null || wishlistAdded
                    ? 'fill-red-500 text-red-500'
                    : ''
                }`}
              />
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
              Save{' '}
              {formatPrice(
                displayProduct.price - (displayProduct.specialPrice ?? 0)
              )}
            </span>
          )}
        </div>
        {showCouponBanner && (
          <div className="mb-4 relative overflow-hidden rounded-2xl bg-destructive px-5 py-4 text-white">
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <div className="absolute -right-10 top-0 h-full w-44">
                <FireworksIcon />
              </div>
            </div>

            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-white/90">
                    {displayPromotionLabel ?? 'Limited time coupon'}
                  </span>
                  {couponOffAmount > 0 ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold leading-none">
                        {formatPrice(priceAfterCoupon)}
                      </span>
                      <span className="text-sm font-semibold text-white/70 line-through">
                        {formatPrice(priceBeforeCoupon)}
                      </span>
                    </div>
                  ) : hasDiscount && displayProduct.specialPrice != null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold leading-none">
                        {formatPrice(displayProduct.specialPrice)}
                      </span>
                      <span className="text-sm font-semibold text-white/70 line-through">
                        {formatPrice(displayProduct.price)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-white/90">
                      Current price {formatPrice(priceBeforeCoupon)}
                    </div>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {couponOffAmount > 0 ? (
                    <span className="font-medium">
                      Use coupon for {formatPrice(couponOffAmount)} off
                    </span>
                  ) : (
                    <span className="font-medium">
                      Use coupon code for savings
                    </span>
                  )}
                  <span className="font-semibold">Discount code: {cpCode}</span>
                  {validUntilText && (
                    <span className="text-white/85">
                      Valid until {validUntilText}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                aria-label="Claim coupon"
                onClick={() => void handleClaimCoupon()}
                className="inline-flex items-center justify-center rounded-full bg-background px-5 py-2 text-sm font-semibold text-destructive shadow-sm transition hover:bg-background/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Claim coupon
              </button>
            </div>

            {showCouponToast && (
              <div className="pointer-events-none absolute bottom-3 right-3 z-10">
                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-4 py-2 text-sm font-medium text-ink shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                  Coupon code copied
                </div>
              </div>
            )}
          </div>
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
            className="prose prose-sm mt-4 max-w-none text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink"
            dangerouslySetInnerHTML={{
              __html: product.short_description_html,
            }}
          />
        ) : product.short_description ? (
          <div
            className="prose prose-sm mt-4 max-w-none text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink"
            dangerouslySetInnerHTML={{
              __html: product.short_description,
            }}
          />
        ) : null}
        {specificationSections.length > 0 && (
          <section
            aria-label="Product specifications sections"
            className="mt-6 border-t border-border"
          >
            {specificationSections.map((section, index) => {
              const isExpanded = expandedSpecificationIndexes.includes(index);

              return (
                <article
                  key={`${section.title}-${index}`}
                  className="border-b border-border"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    onClick={() =>
                      setExpandedSpecificationIndexes(prev =>
                        prev.includes(index)
                          ? prev.filter(item => item !== index)
                          : [...prev, index]
                      )
                    }
                    aria-expanded={isExpanded}
                  >
                    <span className="text-2xl font-semibold text-ink">
                      {section.title}
                    </span>
                    <svg
                      className={`h-6 w-6 shrink-0 text-ink transition-transform ${
                        isExpanded ? 'rotate-45' : ''
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="pb-5">
                      <div
                        className="prose prose-sm max-w-none text-ink-muted [&_a]:text-ink [&_a]:underline hover:[&_a]:text-brand [&_strong]:font-semibold [&_strong]:text-ink"
                        dangerouslySetInnerHTML={{
                          __html: section.contentHtml,
                        }}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
