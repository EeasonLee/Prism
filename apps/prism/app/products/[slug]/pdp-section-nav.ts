import type { UnifiedProduct } from '../../../lib/api/unified-product';
import type { ProductReviewSummary } from '../../../lib/api/strapi/reviews';
import type { ProductPageCms } from './product-page-types';
import { PDP_FEATURES } from './pdp-features';

export type ProductDetailCms = Partial<ProductPageCms>;

/** Sticky 导航：仅包含页面上实际存在的锚点区块 */
export function buildPdpSectionNav(
  cms: ProductDetailCms | null,
  product: UnifiedProduct,
  reviewSummary?: ProductReviewSummary | null
): Array<{ id: string; label: string }> {
  const sections: Array<{ id: string; label: string }> = [];

  const hasFeatures =
    (cms?.key_points?.length ?? 0) > 0 || (cms?.guarantees?.length ?? 0) > 0;
  if (hasFeatures) {
    sections.push({ id: 'section-features', label: 'Features' });
  }

  if (
    (product.product_detail_html?.trim().length ?? 0) > 0 ||
    (cms?.detail_sections?.length ?? 0) > 0
  ) {
    sections.push({ id: 'section-details', label: 'Details' });
  }

  const specRaw = product.specifications as unknown;
  if (Array.isArray(specRaw) && specRaw.length > 0) {
    sections.push({ id: 'section-specifications', label: 'Specifications' });
  }

  const reviewTotal = reviewSummary?.total ?? cms?.review_summary?.total ?? 0;
  if (cms || reviewSummary) {
    sections.push({
      id: 'section-reviews',
      label:
        reviewTotal > 0
          ? `Reviews (${reviewTotal.toLocaleString()})`
          : 'Reviews',
    });
  }

  if ((cms?.product_videos?.length ?? 0) > 0) {
    sections.push({ id: 'section-videos', label: 'Videos' });
  }

  if ((cms?.recipes?.length ?? 0) > 0) {
    sections.push({ id: 'section-recipes', label: 'Recipes' });
  }

  if (PDP_FEATURES.fromBlog && (cms?.blog_posts?.length ?? 0) > 0) {
    sections.push({ id: 'section-blog', label: 'Blog' });
  }

  return sections;
}
