/**
 * Magento 商品目录查询（无需认证）
 */

import { magentoClient } from './client';
import type {
  FetchProductsParams,
  MagentoCategoryDetail,
  MagentoCategoryTree,
  MagentoProduct,
  MagentoProductListResponse,
} from './types';

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    qs.append(key, String(value));
  });
  return qs.toString();
}

/** 获取完整分类树 */
export function fetchCategoryTree(): Promise<MagentoCategoryTree> {
  return magentoClient.get<MagentoCategoryTree>('/api/categories/tree');
}

/** 获取单个分类详情 */
export function fetchCategoryById(
  categoryId: number
): Promise<MagentoCategoryDetail> {
  return magentoClient.get<MagentoCategoryDetail>(
    `/api/categories/${categoryId}`
  );
}

/** 获取商品列表（支持分类筛选、关键词搜索、分页） */
export function fetchProducts(
  params: FetchProductsParams = {}
): Promise<MagentoProductListResponse> {
  const qs = buildQuery({
    categoryId: params.categoryId,
    keyword: params.keyword,
    skus: params.skus,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    storeId: params.storeId ?? 1,
    sort: params.sort,
    order: params.order ?? 'desc',
  });
  return magentoClient.get<MagentoProductListResponse>(
    `/api/products${qs ? `?${qs}` : ''}`
  );
}

/** 根据 SKU 获取商品详情 */
export function fetchProductBySku(sku: string): Promise<MagentoProduct> {
  return magentoClient.get<MagentoProduct>(
    `/api/products/${encodeURIComponent(sku)}`
  );
}
