/**
 * Search / Category 商品检索 service
 *
 * 优先走 Meilisearch；Meilisearch 不可用时（仅分类页）降级到 Magento 链路。
 * 搜索页（无 slug）必须依赖 Meilisearch，无法降级。
 */

import { env } from '@/core/config/env';
import { notifyError } from '@/shared/utils/notify';
import { formatPrice } from '@/shared/utils/format-price';
import { searchProducts } from './search-meilisearch';
import type {
  SearchAvailableFilter,
  ProductSearchQuery,
  ProductSearchResult,
} from './types';

// ――― Meilisearch 工具函数 ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

function buildAvailableFiltersFromFacets(
  facetDistribution?: Record<string, Record<string, number>>
): SearchAvailableFilter[] {
  if (!facetDistribution) return [];

  const filters: SearchAvailableFilter[] = [];

  if (facetDistribution.brand) {
    filters.push({
      key: 'brand',
      label: 'Brand',
      type: 'checkbox',
      options: Object.entries(facetDistribution.brand).map(
        ([value, count]) => ({
          value,
          label: value,
          count,
        })
      ),
    });
  }

  if (facetDistribution.size) {
    filters.push({
      key: 'size',
      label: 'Size',
      type: 'checkbox',
      options: Object.entries(facetDistribution.size).map(([value, count]) => ({
        value,
        label: value,
        count,
      })),
    });
  }

  if (facetDistribution.categories) {
    filters.push({
      key: 'category',
      label: 'Category',
      type: 'checkbox',
      options: Object.entries(facetDistribution.categories).map(
        ([value, count]) => ({
          value,
          label: value,
          count,
        })
      ),
    });
  }

  return filters;
}

// ――― 公开 API ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

async function fetchFromMeilisearch(
  query: ProductSearchQuery
): Promise<ProductSearchResult> {
  const meilisearchResult = await searchProducts({
    q: query.q,
    slug: query.slug,
    brand: query.brand,
    size: query.size,
    category: query.category,
    priceMin: query.price_min,
    priceMax: query.price_max,
    sort: query.sort,
    page: query.page,
    pageSize: query.pageSize,
    facets: ['brand', 'size', 'categories'],
  });

  return {
    category: undefined,
    applied_filters: [
      ...(query.brand
        ? [{ key: 'brand', value: query.brand, label: query.brand }]
        : []),
      ...(query.price_min !== undefined
        ? [
            {
              key: 'price_min',
              value: query.price_min,
              label: `Min ${formatPrice(query.price_min, 'USD')}`,
            },
          ]
        : []),
      ...(query.price_max !== undefined
        ? [
            {
              key: 'price_max',
              value: query.price_max,
              label: `Max ${formatPrice(query.price_max, 'USD')}`,
            },
          ]
        : []),
    ],
    available_filters: buildAvailableFiltersFromFacets(
      meilisearchResult.facetDistribution
    ),
    sort_options: ['featured', 'price_asc', 'price_desc', 'newest'],
    items: meilisearchResult.items,
    pagination: meilisearchResult.pagination,
    total: meilisearchResult.pagination.total,
  };
}

/**
 * 聚合商品搜索结果，仅使用 Meilisearch。
 */
export async function fetchProductSearchResult(
  query: ProductSearchQuery
): Promise<ProductSearchResult> {
  if (!env.MEILISEARCH_HOST) {
    throw new Error('MEILISEARCH_HOST is not configured');
  }
  try {
    return await fetchFromMeilisearch(query);
  } catch (err) {
    await notifyError({
      title: 'Meilisearch Product Search Failed',
      message: `Product search failed for slug: ${query.slug ?? ''}, q: ${
        query.q ?? ''
      }`,
      error: err,
    });
    throw err;
  }
}
