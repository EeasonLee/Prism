'use client';

import { useMemo, useState } from 'react';
import { ProductDetailClient, type ProductDetailSelection } from './ProductDetailClient';
import { ProductImageGallery } from './ProductImageGallery';
import type { MagentoProduct } from '../../../lib/api/magento/types';
import type { UnifiedProductImage } from '../../../lib/api/unified-product';

interface ProductDetailContentProps {
  product: MagentoProduct;
  galleryImages: UnifiedProductImage[];
  ratingPercentage: number;
  ratingCount: number;
}

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

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
        aria-label={`${(percentage / 20).toFixed(1)} out of 5, ${count} reviews`}
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
}: ProductDetailContentProps) {
  const [selection, setSelection] = useState<ProductDetailSelection>({
    selectedVariant: null,
    allSelected: false,
  });

  const displayProduct = useMemo(() => {
    const selectedVariant = selection.selectedVariant;
    const hasCompleteVariantSelection = product.type_id !== 'configurable' || selection.allSelected;

    return {
      sku: hasCompleteVariantSelection ? selectedVariant?.sku ?? product.sku : product.sku,
      price: hasCompleteVariantSelection ? selectedVariant?.price ?? product.price : product.price,
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
        hasCompleteVariantSelection && (selectedVariant?.media_gallery?.length ?? 0) > 0
          ? selectedVariant?.media_gallery?.map(image => ({
              url: image.url,
              alt: image.label ?? product.display_name,
            })) ?? galleryImages
          : galleryImages,
    };
  }, [galleryImages, product, selection]);

  const hasDiscount =
    displayProduct.specialPrice != null && displayProduct.specialPrice < displayProduct.price;

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
              In Stock
              {displayProduct.stockQty != null && (
                <span className="font-normal text-ink-muted">
                  ({displayProduct.stockQty} available)
                </span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Out of Stock
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
              {(displayProduct.price - (displayProduct.specialPrice ?? 0)).toFixed(2)}
            </span>
          )}
        </div>

        {product.promotion_label && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
            <span className="text-sm font-medium text-brand">
              {product.promotion_label}
            </span>
            <span className="text-sm text-ink-muted">
              Save big while offer lasts
            </span>
          </div>
        )}

        {product.short_description_html && (
          <div
            className="prose prose-sm mb-4 max-w-none text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink"
            dangerouslySetInnerHTML={{
              __html: product.short_description_html,
            }}
          />
        )}

        <ProductDetailClient product={product} onSelectionChange={setSelection} />

        {product.description_html && (
          <div className="mt-6 border-t border-border pt-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Description
            </h2>
            <div
              className="prose prose-sm max-w-none text-ink [&_li]:my-0.5 [&_ul]:pl-4"
              dangerouslySetInnerHTML={{ __html: product.description_html }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
