'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ProductDetailContent } from './ProductDetailContent';
import { ProductReviews, type ReviewTarget } from './ProductReviews';
import { buildProductShareTarget } from './build-product-share-target';
import type { ProductDetailSelection } from './ProductDetailClient';
import type {
  ProductReview,
  ProductReviewPagination,
  ProductReviewSummary,
} from '../../../lib/api/strapi/reviews';
import type {
  MagentoConfigurableOption,
  MagentoProduct,
} from '../../../lib/api/magento/types';
import type { UnifiedProductImage } from '../../../lib/api/unified-product';
import type { ProductPageExtras, Review as MockReview } from './mock-data';

interface ProductDetailReviewShellProps {
  product: MagentoProduct;
  galleryImages: UnifiedProductImage[];
  ratingPercentage: number;
  ratingCount: number;
  reviewSku: string;
  summary?: ProductReviewSummary;
  initialReviews?: ProductReview[];
  initialPagination?: ProductReviewPagination;
  mockSummary?: ProductPageExtras['review_summary'];
  mockReviews?: MockReview[];
  allowSubmit?: boolean;
}

function buildVariantLabel(
  product: MagentoProduct,
  selection: ProductDetailSelection
) {
  if (
    product.type_id !== 'configurable' ||
    !selection.allSelected ||
    !selection.selectedVariant
  ) {
    return null;
  }

  const configurableOptions: MagentoConfigurableOption[] =
    product.configurable_options ??
    product.extension_attributes?.configurable_product_options ??
    [];
  const attributes = product.children?.find(
    item => item.sku === selection.selectedVariant?.sku
  )?.attributes;

  if (!attributes) {
    return null;
  }

  const labels = configurableOptions
    .map(option => {
      const rawValue =
        attributes[option.attribute_id] ??
        (option.attribute_code ? attributes[option.attribute_code] : undefined);
      if (!rawValue) {
        return null;
      }

      const matched = option.values.find(
        value =>
          String(value.value_index) === rawValue || value.label === rawValue
      );

      return matched?.label ?? rawValue;
    })
    .filter((value): value is string => Boolean(value));

  return labels.length > 0 ? labels.join(' / ') : null;
}

export function ProductDetailReviewShell({
  product,
  galleryImages,
  ratingPercentage,
  ratingCount,
  reviewSku,
  summary,
  initialReviews,
  initialPagination,
  mockSummary,
  mockReviews,
  allowSubmit = true,
}: ProductDetailReviewShellProps) {
  const pathname = usePathname();
  const [selection, setSelection] = useState<ProductDetailSelection>({
    selectedVariant: null,
    allSelected: false,
  });

  const shareTarget = useMemo(() => {
    if (typeof window === 'undefined' || !pathname) {
      return undefined;
    }

    return buildProductShareTarget(
      product,
      pathname,
      window.location.origin,
      selection
    );
  }, [pathname, product, selection]);

  const reviewTarget = useMemo<ReviewTarget>(() => {
    if (product.type_id === 'configurable') {
      return {
        productSku: product.sku,
        purchasedSku: selection.allSelected
          ? selection.selectedVariant?.sku ?? null
          : null,
        purchasedVariantLabel: buildVariantLabel(product, selection),
        requiresVariantSelection: !selection.allSelected,
      };
    }

    return {
      productSku: product.sku,
      purchasedSku: product.sku,
      purchasedVariantLabel: null,
      requiresVariantSelection: false,
    };
  }, [product, selection]);

  return (
    <>
      <ProductDetailContent
        product={product}
        galleryImages={galleryImages}
        ratingPercentage={ratingPercentage}
        ratingCount={ratingCount}
        selection={selection}
        onSelectionChange={setSelection}
        shareTarget={shareTarget}
      />

      <div id="section-reviews">
        <div className="border-t border-border" />
        <ProductReviews
          sku={reviewSku}
          target={reviewTarget}
          summary={summary}
          initialReviews={initialReviews}
          initialPagination={initialPagination}
          mockSummary={mockSummary}
          mockReviews={mockReviews}
          allowSubmit={allowSubmit}
        />
      </div>
    </>
  );
}
