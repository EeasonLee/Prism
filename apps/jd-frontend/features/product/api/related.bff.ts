import { fetchProductDetailBySkuGQL } from './product-graphql.service';
import { fetchRelatedBySlug } from '@/features/search';
import type { RelatedProductItem } from '@/features/search';
import { processProductImageUrl } from '@prism/shared';

/**
 * PDP related products BFF 入口。
 *
 * 当前阶段只做既有 route 逻辑的收口，不改变数据来源、fallback 策略或返回项结构。
 * 后续如果需要接入缓存、监控或更复杂的推荐聚合，应优先在这一层扩展。
 */
export async function getRelatedProductsBFF(
  sku: string
): Promise<RelatedProductItem[]> {
  const raw = await fetchProductDetailBySkuGQL(sku);
  const firstCategory = raw.categories?.[0];

  if (firstCategory) {
    const categorySlug = firstCategory.name.toLowerCase().replace(/\s+/g, '-');

    try {
      return await fetchRelatedBySlug(categorySlug, sku);
    } catch {
      return fetchRelatedFromMagento(sku);
    }
  }

  return fetchRelatedFromMagento(sku);
}

/** 从 Magento variants fallback */
async function fetchRelatedFromMagento(
  sku: string
): Promise<RelatedProductItem[]> {
  try {
    const raw = await fetchProductDetailBySkuGQL(sku);
    const variants = raw.variants ?? [];
    return variants.slice(0, 8).map(v => ({
      sku: v.product.sku,
      name: v.product.name,
      price: v.product.price_range.minimum_price.final_price.value,
      image:
        processProductImageUrl(v.product.media_gallery?.[0]?.url) ??
        v.product.media_gallery?.[0]?.url ??
        '',
      inStock: v.product.stock_status === 'IN_STOCK',
    }));
  } catch {
    return [];
  }
}
