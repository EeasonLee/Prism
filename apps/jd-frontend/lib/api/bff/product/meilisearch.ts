import { productQueryFacade } from '@/lib/application/product/product-query-facade';
import type { ProductCardItem } from './types';

// ─── 查询参数与结果类型 ────────────────────────────────────────────────────────────────

export interface ProductMeilisearchParams {
  categoryId?: number;
  categoryName?: string;
  categorySlug?: string;
  page?: number;
  pageSize?: number;
  sort?: 'name' | 'price';
}

export interface ProductMeilisearchResult {
  items: ProductCardItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function searchProductsForBFF(
  params: ProductMeilisearchParams
): Promise<ProductMeilisearchResult> {
  const result = await productQueryFacade.queryProducts({
    magentoCategoryId: params.categoryId,
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort === 'price' ? 'price_asc' : 'name',
    filters: {
      category: params.categoryName,
    },
  });

  return {
    items: result.items,
    pagination: result.pagination,
  };
}

export async function searchProductsBySkusForBFF(
  skus: string[]
): Promise<ProductCardItem[]> {
  return productQueryFacade.queryBySkus(skus);
}
