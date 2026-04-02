import type { UnifiedProduct } from '../../../lib/api/unified-product';
import type { ProductReviewSummary } from '../../../lib/api/strapi/reviews';
import type { ProductPageCms } from './mock-data';

/**
 * 商品详情页服务端组装结果。
 * - product：Magento UnifiedProduct
 * - cms：mock 数据（真实 SKU 为 null）
 */
export type ProductDetailCms = ProductPageCms;

export interface ProductDetailPageData {
  product: UnifiedProduct;
  cms: ProductDetailCms | null;
}

export function buildRealProductPageCms(_product: UnifiedProduct): null {
  return null;
}

/** Sticky 导航：仅包含页面上实际存在的锚点区块 */
export function buildPdpSectionNav(
  cms: ProductPageCms | null,
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

  if ((product.specifications?.length ?? 0) > 0) {
    sections.push({ id: 'section-specifications', label: 'Specifications' });
  }

  const reviewTotal = reviewSummary?.total ?? cms?.review_summary.total ?? 0;
  if (cms || reviewSummary) {
    sections.push({
      id: 'section-reviews',
      label:
        reviewTotal > 0
          ? `Reviews (${reviewTotal.toLocaleString()})`
          : 'Reviews',
    });
  }

  if ((cms?.recipes?.length ?? 0) > 0) {
    sections.push({ id: 'section-recipes', label: 'Recipes' });
  }

  if ((cms?.blog_posts?.length ?? 0) > 0) {
    sections.push({ id: 'section-blog', label: 'Blog' });
  }

  return sections;
}
