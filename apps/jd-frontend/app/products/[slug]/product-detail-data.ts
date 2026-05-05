import type { UnifiedProduct } from '@/features/product/unified.api';
import type { ProductReviewSummary } from '@/features/product/reviews.api';
import {
  fetchPdpArticlesBySku,
  fetchPdpProductVideosBySku,
  fetchPdpRecipesBySku,
} from '@/features/product/content.api';
import type { ProductPageCms } from './product-page-types';
import { PDP_FEATURES } from './pdp-features';

/**
 * 商品详情页服务端组装结果。
 * - product：Magento UnifiedProduct
 * - cms：Strapi 侧与 PDP 区块相关的片段（当前：食谱、博客来自 Product 关联，经 by-product-sku 接口）
 */
export type ProductDetailCms = Partial<ProductPageCms>;

export interface ProductDetailPageData {
  product: UnifiedProduct;
  cms: ProductDetailCms | null;
}

/**
 * 从 Strapi `api::product.product` 与 recipe/article/product-video 的关联拉取 PDP 区块。
 * 后端路由：`/api/recipes/by-product-sku/:sku`、`/api/articles/by-product-sku/:sku`、
 * `api/product-videos/by-product-sku/:sku`（按 Product.sku 过滤关联）。
 */
export async function fetchRealProductPageCms(
  sku: string
): Promise<ProductDetailCms | null> {
  const blogPostsPromise = PDP_FEATURES.fromBlog
    ? fetchPdpArticlesBySku(sku).catch(() => [])
    : Promise.resolve([]);

  const [recipes, blog_posts, product_videos] = await Promise.all([
    fetchPdpRecipesBySku(sku).catch(() => []),
    blogPostsPromise,
    fetchPdpProductVideosBySku(sku).catch(() => []),
  ]);

  if (
    recipes.length === 0 &&
    blog_posts.length === 0 &&
    product_videos.length === 0
  ) {
    return null;
  }

  return { recipes, blog_posts, product_videos };
}

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
  if (reviewTotal > 0) {
    sections.push({
      id: 'section-reviews',
      label: `Reviews (${reviewTotal.toLocaleString()})`,
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
