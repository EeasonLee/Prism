'use client';

import { useMemo, useState } from 'react';
import {
  ProductDetailClient,
  type ProductDetailSelection,
} from './ProductDetailClient';
import { ProductImageGallery } from './ProductImageGallery';
import { ShareTrigger } from '../../components/share';
import type {
  UnifiedProduct,
  UnifiedProductImage,
} from '../../../lib/api/unified-product';
import type { ShareTarget } from '../../components/share';

interface ProductDetailContentProps {
  product: UnifiedProduct;
  galleryImages: UnifiedProductImage[];
  ratingPercentage: number;
  ratingCount: number;
  selection: ProductDetailSelection;
  onSelectionChange: (selection: ProductDetailSelection) => void;
  shareTarget?: ShareTarget;
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
}: {
  percentage: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
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
      <span
        className="text-sm text-ink-muted"
        aria-label={`${(percentage / 20).toFixed(
          1
        )} out of 5, ${count} reviews`}
      >
        {(percentage / 20).toFixed(1)} ({count}{' '}
        {count === 1 ? 'review' : 'reviews'})
      </span>
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
  shareTarget,
}: ProductDetailContentProps) {
  const [showCouponToast, setShowCouponToast] = useState(false);

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

  const displayProduct = useMemo(() => {
    const selectedVariant = selection.selectedVariant;
    const hasCompleteVariantSelection =
      product.type_id !== 'configurable' || selection.allSelected;

    return {
      sku: hasCompleteVariantSelection
        ? selectedVariant?.sku ?? product.sku
        : product.sku,
      price: hasCompleteVariantSelection
        ? selectedVariant?.price ?? product.price
        : product.price,
      specialPrice: hasCompleteVariantSelection
        ? selectedVariant?.special_price ?? product.special_price
        : product.special_price,
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
              alt: image.label ?? product.display_name,
            })) ?? galleryImages
          : galleryImages,
    };
  }, [galleryImages, product, selection]);

  const hasDiscount =
    displayProduct.specialPrice != null &&
    displayProduct.specialPrice < displayProduct.price;

  const cpCode = product.cp_code ?? null;
  const cpDateMs = parseCouponDateMs(product.cp_date);
  const isCouponExpired = cpDateMs != null ? cpDateMs < Date.now() : false;

  const showCouponBanner =
    typeof cpCode === 'string' && cpCode.trim().length > 0 && !isCouponExpired;

  const regularPrice = displayProduct.price;
  const discountedPrice =
    displayProduct.specialPrice != null && hasDiscount
      ? displayProduct.specialPrice
      : null;
  const couponOff =
    discountedPrice != null ? Math.max(0, regularPrice - discountedPrice) : 0;

  const validUntilText =
    cpDateMs != null && !isCouponExpired
      ? new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }).format(new Date(cpDateMs))
      : null;

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
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
      <div className="lg:sticky lg:top-[89px]">
        <ProductImageGallery
          images={displayProduct.images}
          productName={product.display_name}
        />
      </div>

      <div className="flex flex-col gap-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            SKU: {displayProduct.sku}
          </span>
          {debugCoupon && (
            <span className="text-[11px] font-medium text-ink-muted">
              [debugCoupon] cp_code={cpCode ?? 'null'}, cp_date=
              {product.cp_date ?? 'null'}, cpDateMs={cpDateMs ?? 'null'},
              expired=
              {isCouponExpired ? 'true' : 'false'}, showBanner=
              {showCouponBanner ? 'true' : 'false'}
            </span>
          )}
          {product.promotion_label && (
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-brand-foreground">
              {product.promotion_label}
            </span>
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold leading-tight text-ink sm:text-3xl">
          {product.display_name}
        </h1>

        {product.subtitle && (
          <p className="mb-3 text-base text-ink-muted">{product.subtitle}</p>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {displayProduct.isInStock ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Item is in stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Item is out of stock
            </span>
          )}
          {ratingCount > 0 && (
            <StarRating percentage={ratingPercentage} count={ratingCount} />
          )}
        </div>

        <div className="mb-4 flex items-baseline gap-3">
          {displayProduct.specialPrice != null && (
            <span className="text-2xl font-bold text-ink">
              ${displayProduct.specialPrice.toFixed(2)}
            </span>
          )}
          {displayProduct.price > 0 && (
            <span
              className={
                hasDiscount
                  ? 'text-base text-ink-muted line-through'
                  : 'text-2xl font-bold text-ink'
              }
            >
              ${displayProduct.price.toFixed(2)}
            </span>
          )}
          {hasDiscount && (
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
              Save $
              {(
                displayProduct.price - (displayProduct.specialPrice ?? 0)
              ).toFixed(2)}
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
                    {product.promotion_label ?? 'Limited time coupon'}
                  </span>
                  {discountedPrice != null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold leading-none">
                        ${discountedPrice.toFixed(2)}
                      </span>
                      <span className="text-sm font-semibold text-white/70 line-through">
                        ${regularPrice.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-white/90">
                      Current price ${regularPrice.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {discountedPrice != null && couponOff > 0 ? (
                    <span className="font-medium">
                      Use coupon for ${couponOff.toFixed(2)} off
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

        {shareTarget && (
          <div className="mb-4 flex items-center">
            <ShareTrigger target={shareTarget} />
          </div>
        )}

        {product.promotion_label && !showCouponBanner && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
            <span className="text-sm font-medium text-brand">
              {product.promotion_label}
            </span>
            <span className="text-sm text-ink-muted">
              Save big while offer lasts
            </span>
          </div>
        )}

        {product.short_description_html ? (
          <div
            className="prose prose-sm mb-4 max-w-none text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink"
            dangerouslySetInnerHTML={{
              __html: product.short_description_html,
            }}
          />
        ) : product.short_description ? (
          <div
            className="prose prose-sm mb-4 max-w-none text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink"
            dangerouslySetInnerHTML={{
              __html: product.short_description,
            }}
          />
        ) : null}

        <ProductDetailClient
          product={product}
          onSelectionChange={onSelectionChange}
        />
      </div>
    </div>
  );
}
