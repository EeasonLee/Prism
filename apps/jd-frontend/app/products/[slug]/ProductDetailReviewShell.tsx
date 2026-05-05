'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ProductDetailContent } from './ProductDetailContent';
import { ProductDetailsSection } from './ProductDetailsSection';
import { ProductReviews, type ReviewTarget } from './ProductReviews';
import { ProductVideosSection } from './ProductVideosSection';
import { RecipesSection } from './RecipesSection';
import { ProductBackToTopButton } from './ProductBackToTopButton';
import { buildProductShareTarget } from './build-product-share-target';
import { env } from '@/core/config/env';
import type { ProductDetailSelection } from './ProductDetailClient';
import type {
  ProductReview,
  ProductReviewPagination,
  ProductReviewSummary,
} from '@/features/product/reviews.api';
import type { ProductQaListResult } from '@/features/product/qa.api';
import { ProductQA } from './ProductQA';
import type {
  UnifiedProduct,
  UnifiedProductImage,
} from '@/features/product/unified.api';
import type { ProductVideoCard, Recipe } from './product-page-types';

interface ProductDetailReviewShellProps {
  product: UnifiedProduct;
  galleryImages: UnifiedProductImage[];
  ratingPercentage: number;
  ratingCount: number;
  reviewSku: string;
  summary?: ProductReviewSummary;
  initialReviews?: ProductReview[];
  initialPagination?: ProductReviewPagination;
  allowSubmit?: boolean;
  initialProductQa: ProductQaListResult;
  beforeVideos?: ReactNode;
  videos?: ProductVideoCard[];
  recipes?: Recipe[];
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
  allowSubmit = true,
  initialProductQa,
  beforeVideos,
  videos = [],
  recipes = [],
}: ProductDetailReviewShellProps) {
  const pathname = usePathname();
  const [selection, setSelection] = useState<ProductDetailSelection>({
    selectedVariant: null,
    allSelected: false,
    customOptionPriceDelta: 0,
  });
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  const handleWriteReview = useCallback(() => {
    setIsReviewFormOpen(true);
  }, []);

  const shareTarget = useMemo(() => {
    if (!pathname) {
      return undefined;
    }

    return buildProductShareTarget(
      product,
      pathname,
      env.NEXT_PUBLIC_APP_URL,
      selection
    );
  }, [pathname, product, selection]);

  const reviewTarget = useMemo<ReviewTarget>(() => {
    return {
      sku: product.sku,
      requiresVariantSelection:
        product.type_id === 'configurable' ? !selection.allSelected : false,
    };
  }, [product, selection]);

  const hasReviewData =
    (summary?.total ?? 0) > 0 ||
    (initialPagination?.total ?? 0) > 0 ||
    (initialReviews?.length ?? 0) > 0;

  return (
    <>
      <ProductDetailContent
        product={product}
        galleryImages={galleryImages}
        ratingPercentage={ratingPercentage}
        ratingCount={ratingCount}
        selection={selection}
        onSelectionChange={setSelection}
        onWriteReview={handleWriteReview}
        shareTarget={shareTarget}
      />

      {beforeVideos}

      {videos.length > 0 && (
        <div id="section-videos">
          <ProductVideosSection videos={videos} />
        </div>
      )}

      {product.product_detail_html && (
        <ProductDetailsSection detailsHtml={product.product_detail_html} />
      )}

      {recipes.length > 0 && (
        <div id="section-recipes">
          <RecipesSection recipes={recipes} />
        </div>
      )}

      {hasReviewData && (
        <div id="section-reviews">
          <ProductReviews
            sku={reviewSku}
            target={reviewTarget}
            summary={summary}
            initialReviews={initialReviews}
            initialPagination={initialPagination}
            allowSubmit={allowSubmit}
            isReviewFormOpen={isReviewFormOpen}
            onReviewFormOpenChange={setIsReviewFormOpen}
          />
        </div>
      )}

      <div id="section-product-qa">
        <ProductQA
          productId={product.id}
          sku={reviewSku}
          initialResult={initialProductQa}
          allowSubmit={allowSubmit}
        />
      </div>

      <ProductBackToTopButton />
    </>
  );
}
