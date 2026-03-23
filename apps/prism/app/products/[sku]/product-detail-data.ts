import type {
  UnifiedProduct,
  UnifiedProductContent,
} from '../../../lib/api/unified-product';
import type { ProductReviewSummary } from '../../../lib/api/strapi/reviews';
import type { ProductPageCms } from './mock-data';

export type RealProductPageCms = Pick<
  ProductPageCms,
  'key_points' | 'guarantees' | 'recipes' | 'blog_posts'
>;

export function buildRealProductPageCms(
  content: UnifiedProductContent | undefined
): RealProductPageCms | null {
  const key_points = content?.key_points ?? [];
  const guarantees = content?.guarantees ?? [];
  const recipes = content?.recipes ?? [];
  const blog_posts = content?.blog_posts ?? [];

  if (
    key_points.length === 0 &&
    guarantees.length === 0 &&
    recipes.length === 0 &&
    blog_posts.length === 0
  ) {
    return null;
  }

  return {
    key_points,
    guarantees,
    recipes,
    blog_posts,
  };
}

/**
 * 商品详情页服务端组装结果。
 * - product：Magento + Strapi 融合（UnifiedProduct）
 * - cms：卖点、保障、图文块、评论列表等；真实 SKU 在 Strapi 扩展前为 null
 */
export type ProductDetailCms = ProductPageCms | RealProductPageCms;

export interface ProductDetailPageData {
  product: UnifiedProduct;
  cms: ProductDetailCms | null;
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

  const hasStrapiProductDetail =
    (product.product_detail_html?.trim().length ?? 0) > 0;
  const hasMockDetailSections = (cms?.detail_sections?.length ?? 0) > 0;
  if (hasStrapiProductDetail || hasMockDetailSections) {
    sections.push({ id: 'section-details', label: 'Details' });
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
