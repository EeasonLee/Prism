import type { ProductListResult } from './types';
import { searchProductsForBFF } from './meilisearch';

export type { ProductCardItem, ProductListResult } from './types';

export interface GetProductListBFFParams {
  categoryId?: number;
  categoryName?: string;
  categorySlug?: string;
  page?: number;
  limit?: number;
  sort?: 'name' | 'price';
}

/**
 * Product list BFF 入口。
 *
 * 数据源直接来自 Meilisearch joydeem_product_en 索引，
 * 索引已包含实时价格、库存和促销信息，不再调用 catalog-sync-service。
 */
export async function getProductListBFF(
  params: GetProductListBFFParams
): Promise<ProductListResult> {
  return searchProductsForBFF({
    categoryId: params.categoryId,
    categoryName: params.categoryName,
    categorySlug: params.categorySlug,
    page: params.page,
    pageSize: params.limit,
    sort: params.sort,
  });
}
