'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ProductDetailContent } from './ProductDetailContent';
import { ProductDetailsSection } from './ProductDetailsSection';
import { ProductReviews, type ReviewTarget } from './ProductReviews';
import { ProductVideosSection } from './ProductVideosSection';
import { RecipesSection } from './RecipesSection';
import { ProductBackToTopButton } from './ProductBackToTopButton';
import { buildProductShareTarget } from './build-product-share-target';
import { gtmViewItem, mapDisplayToGtmItem } from '@/shared/utils/gtm';
import type { ProductDetailSelection } from './ProductDetailClient';
import type {
  ProductReview,
  ProductReviewPagination,
  ProductReviewSummary,
} from '@/features/product';
import type { UnifiedProduct, UnifiedProductImage } from '@/features/product';
import type {
  ProductVideoCard,
  PdpRecipeCard,
  ProductCardItem,
} from '@/features/product';
import { ExpandableHtmlSections } from './ExpandableHtmlSections';
import { parseHtmlIntoSections } from './parse-html-sections';

import type { MagentoMediaGalleryItem } from '@/features/product';

interface ProductDetailReviewShellProps {
  product: UnifiedProduct;
  galleryImages: UnifiedProductImage[];
  ratingPercentage: number;
  ratingCount: number;
  reviewSku: string;
  summary?: ProductReviewSummary;
  initialReviews?: ProductReview[];
  initialPagination?: ProductReviewPagination;
  addonProducts?: Record<number, ProductCardItem>;
  allowSubmit?: boolean;
  beforeVideos?: ReactNode;
  videos?: ProductVideoCard[];
  recipes?: PdpRecipeCard[];
  mediaGallery?: MagentoMediaGalleryItem[];
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
  addonProducts,
  allowSubmit = true,
  beforeVideos,
  videos = [],
  recipes = [],
  mediaGallery,
}: ProductDetailReviewShellProps) {
  const [selection, setSelection] = useState<ProductDetailSelection>({
    selectedVariant: null,
    allSelected: false,
    customOptionPriceDelta: 0,
  });
  const getShareTarget = useCallback(
    () => buildProductShareTarget(product, window.location.href, selection),
    [product, selection]
  );
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  // GTM: view_item on product detail page mount
  useEffect(() => {
    const item = mapDisplayToGtmItem({
      sku: product.sku,
      name: product.display_name,
      price: product.price,
      final_price: product.special_price ?? product.price,
      currency: product.currency,
      categories: product.categories?.map((c: { name: string }) => c.name),
      brand: (product as unknown as Record<string, unknown>).brand as
        | string
        | undefined,
      url_key: product.url_key,
      image: product.unified_thumbnail,
    });
    gtmViewItem(item);
  }, [product.sku]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWriteReview = useCallback(() => {
    setIsReviewFormOpen(true);
  }, []);

  const reviewTarget = useMemo<ReviewTarget>(() => {
    return {
      sku: product.sku,
      requiresVariantSelection:
        product.type_id === 'configurable' ? !selection.allSelected : false,
    };
  }, [product, selection]);

  const faqSections = useMemo(
    () => parseHtmlIntoSections(product.faqs),
    [product.faqs]
  );

  const hasReviewData =
    (summary?.total ?? 0) > 0 ||
    (initialPagination?.total ?? 0) > 0 ||
    (initialReviews?.length ?? 0) > 0;

  // 即使还没有评论，只要允许提交，也要挂载 ProductReviews 以提供 ReviewForm 弹窗
  const shouldMountReviews = hasReviewData || allowSubmit;

  return (
    <div>
      <ProductDetailContent
        product={product}
        galleryImages={galleryImages}
        ratingPercentage={ratingPercentage}
        ratingCount={ratingCount}
        selection={selection}
        onSelectionChange={setSelection}
        onWriteReview={handleWriteReview}
        shareTarget={getShareTarget}
        addonProducts={addonProducts}
        mediaGallery={mediaGallery}
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

      {shouldMountReviews && (
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

      {faqSections.length > 0 && (
        <section
          id="section-product-faqs"
          aria-labelledby="product-faqs-heading"
          className="py-12 lg:py-16"
        >
          <h2
            id="product-faqs-heading"
            className="heading-3 mb-6 text-center text-ink"
          >
            Questions and answers
          </h2>
          <ExpandableHtmlSections
            sections={faqSections}
            ariaLabel="Product FAQ sections"
          />
        </section>
      )}

      <ProductBackToTopButton />
    </div>
  );
}
