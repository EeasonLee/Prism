/**
 * Meilisearch 相关商品查询服务
 *
 * 基于 category slug 和 tags 查询相关商品，
 * 作为产品详情页 related products 内部 service 的主要数据源。
 */

import { productQueryFacade } from '@/features/product';
import { resolveImageUrl } from '@/infrastructure/config/image';

export interface RelatedProductItem {
  sku: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
}

/**
 * 通过 Meilisearch 按 category slug 搜索相关商品
 * @param slug       category slug（来自商品的第一个分类）
 * @param excludeSku 排除当前商品自身
 * @param limit      返回数量（默认 8）
 */
export async function fetchRelatedBySlug(
  slug: string,
  excludeSku: string,
  limit = 8
): Promise<RelatedProductItem[]> {
  const result = await productQueryFacade.queryProducts({
    filters: { category: slug },
    includeFacets: false,
    pageSize: limit + 1, // 多取一条用于排除自身
  });

  return result.items
    .filter(item => item.sku !== excludeSku)
    .slice(0, limit)
    .map(item => ({
      sku: item.sku,
      name: item.name,
      price: item.price.value ?? 0,
      image: resolveImageUrl(item.image) ?? item.image ?? '',
      inStock: item.inStock ?? true,
    }));
}
