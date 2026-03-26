/**
 * 商品发现 service 层
 *
 * 优先使用 Meilisearch 检索；Meilisearch 不可用时（仅分类页）降级到 Magento 链路。
 * 搜索页（无 slug）必须依赖 Meilisearch，无法降级。
 */

import { env } from '../../env';
import { fetchUnifiedProducts, type UnifiedProduct } from '../unified-product';
import {
  fetchDiscoveryCategoryBySlug,
  fetchDiscoveryCategoryMapping,
  fetchDiscoveryFilterConfig,
} from '../strapi/discovery';
import { searchProducts } from './meilisearch';
import type {
  DiscoveryAvailableFilter,
  DiscoveryCategory,
  DiscoveryFilterConfig,
  DiscoverySortOption,
  ProductCardItem,
  ProductDiscoveryQuery,
  ProductDiscoveryResult,
} from './types';

// ─── Magento fallback 工具函数 ────────────────────────────────────────────────
// TODO: remove after Meilisearch products index is live

function mapSortToMagento(sort?: DiscoverySortOption): {
  sort?: 'entity_id' | 'price' | 'position';
  order?: 'asc' | 'desc';
} {
  switch (sort) {
    case 'price_asc':
      return { sort: 'price', order: 'asc' };
    case 'price_desc':
      return { sort: 'price', order: 'desc' };
    case 'newest':
      return { sort: 'entity_id', order: 'desc' };
    case 'featured':
    default:
      return { sort: 'position', order: 'asc' };
  }
}

function toProductCardItemFromMagento(
  product: UnifiedProduct
): ProductCardItem {
  const childPrices = product.children
    .map(child => child.price)
    .filter((price): price is number => typeof price === 'number' && price > 0);
  const hasPriceRange = childPrices.length > 1;

  return {
    sku: product.sku,
    name: product.display_name,
    subtitle: product.subtitle ?? undefined,
    thumbnail: product.unified_thumbnail ?? undefined,
    price: product.special_price ?? product.price,
    price_range: hasPriceRange
      ? { min: Math.min(...childPrices), max: Math.max(...childPrices) }
      : undefined,
    currency: product.currency ?? undefined,
    in_stock: product.is_in_stock !== false,
    promotion_label: product.promotion_label ?? undefined,
    href: `/products/${encodeURIComponent(product.sku)}`,
  };
}

function buildAvailableFiltersFromConfig(
  filterConfig: DiscoveryFilterConfig | null
): DiscoveryAvailableFilter[] {
  if (!filterConfig?.is_enabled) return [];

  return filterConfig.enabled_filters.flatMap(filterKey => {
    if (filterKey === 'brand') {
      return [
        {
          key: 'brand',
          label: 'Brand',
          type: 'checkbox' as const,
          options: [],
        },
      ];
    }
    if (filterKey === 'price') {
      return [
        {
          key: 'price',
          label: 'Price',
          type: 'range' as const,
          options: filterConfig.price_ranges.map(range => ({
            value: range.label,
            label: range.label,
          })),
        },
      ];
    }
    return [];
  });
}

// ─── Meilisearch 工具函数 ──────────────────────────────────────────────────────

function buildAvailableFiltersFromFacets(
  facetDistribution?: Record<string, Record<string, number>>
): DiscoveryAvailableFilter[] {
  if (!facetDistribution) return [];

  const filters: DiscoveryAvailableFilter[] = [];

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

  return filters;
}

// ─── 公开 API ─────────────────────────────────────────────────────────────────

/**
 * 将前台分类 slug 翻译为 Magento 分类 ID 集合，并返回筛选配置。
 * TODO: remove after Meilisearch products index is live
 */
export async function resolveDiscoveryQuery(
  query: ProductDiscoveryQuery
): Promise<{
  magentoCategoryIds: number[];
  filterConfig: DiscoveryFilterConfig | null;
}> {
  if (!query.slug) {
    return { magentoCategoryIds: [], filterConfig: null };
  }

  const category = await fetchDiscoveryCategoryBySlug(query.slug);
  if (!category) {
    return { magentoCategoryIds: [], filterConfig: null };
  }

  const [magentoCategoryIds, filterConfig] = await Promise.all([
    fetchDiscoveryCategoryMapping(String(category.id)),
    fetchDiscoveryFilterConfig(String(category.id)),
  ]);

  return {
    magentoCategoryIds: Array.from(new Set(magentoCategoryIds)),
    filterConfig,
  };
}

async function fetchDiscoveryResultFromMeilisearch(
  query: ProductDiscoveryQuery
): Promise<ProductDiscoveryResult> {
  // 分类页需要同时获取 Strapi 分类信息（banner、SEO 等）
  const categoryPromise: Promise<DiscoveryCategory | null> = query.slug
    ? fetchDiscoveryCategoryBySlug(query.slug)
    : Promise.resolve(null);

  const [meilisearchResult, category] = await Promise.all([
    searchProducts({
      q: query.q,
      slug: query.slug,
      brand: query.brand,
      priceMin: query.price_min,
      priceMax: query.price_max,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
      facets: ['brand'],
    }),
    categoryPromise,
  ]);

  if (query.slug && !category) {
    throw new Error(`Discovery category not found for slug: ${query.slug}`);
  }

  return {
    category: category ?? undefined,
    applied_filters: [
      ...(query.brand
        ? [{ key: 'brand', value: query.brand, label: query.brand }]
        : []),
      ...(query.price_min !== undefined
        ? [
            {
              key: 'price_min',
              value: query.price_min,
              label: `Min $${query.price_min}`,
            },
          ]
        : []),
      ...(query.price_max !== undefined
        ? [
            {
              key: 'price_max',
              value: query.price_max,
              label: `Max $${query.price_max}`,
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

// TODO: remove after Meilisearch products index is live
async function fetchDiscoveryResultFromMagento(
  query: ProductDiscoveryQuery
): Promise<ProductDiscoveryResult> {
  const slug = query.slug as string;
  const category = await fetchDiscoveryCategoryBySlug(slug);
  if (!category) {
    throw new Error(`Discovery category not found for slug: ${slug}`);
  }

  const { magentoCategoryIds, filterConfig } = await resolveDiscoveryQuery(
    query
  );
  const effectiveSort =
    query.sort ?? filterConfig?.default_sort ?? category.default_sort;
  const sortParams = mapSortToMagento(effectiveSort);

  const productResponses = await Promise.all(
    magentoCategoryIds.map(categoryId =>
      fetchUnifiedProducts({
        categoryId,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 24,
        ...sortParams,
      }).catch(() => ({
        items: [],
        total_count: 0,
        page_info: {
          current_page: query.page ?? 1,
          page_size: query.pageSize ?? 24,
          total_pages: 0,
        },
      }))
    )
  );

  const mergedProducts = Array.from(
    productResponses
      .flatMap(response => response.items)
      .reduce<Map<string, UnifiedProduct>>((acc, product) => {
        if (!acc.has(product.sku)) acc.set(product.sku, product);
        return acc;
      }, new Map())
      .values()
  );

  const filteredProducts = mergedProducts.filter(product => {
    const matchesBrand =
      !query.brand ||
      String(product.extra_attributes?.brand ?? '').toLowerCase() ===
        query.brand.toLowerCase();
    const effectivePrice = product.special_price ?? product.price;
    const matchesMin =
      query.price_min === undefined || effectivePrice >= query.price_min;
    const matchesMax =
      query.price_max === undefined || effectivePrice <= query.price_max;
    return matchesBrand && matchesMin && matchesMax;
  });

  const allItems = filteredProducts.map(toProductCardItemFromMagento);
  const total = allItems.length;
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 24;
  const items = allItems.slice((page - 1) * pageSize, page * pageSize);

  return {
    category,
    applied_filters: [
      ...(query.brand
        ? [{ key: 'brand', value: query.brand, label: query.brand }]
        : []),
      ...(query.price_min !== undefined
        ? [
            {
              key: 'price_min',
              value: query.price_min,
              label: `Min $${query.price_min}`,
            },
          ]
        : []),
      ...(query.price_max !== undefined
        ? [
            {
              key: 'price_max',
              value: query.price_max,
              label: `Max $${query.price_max}`,
            },
          ]
        : []),
    ],
    available_filters: buildAvailableFiltersFromConfig(filterConfig),
    sort_options: filterConfig?.sort_options ?? [
      'featured',
      'price_asc',
      'price_desc',
      'newest',
    ],
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    total,
  };
}

/**
 * 聚合商品发现结果，优先使用 Meilisearch，不可用时降级到 Magento（仅分类页）。
 */
export async function fetchDiscoveryResult(
  query: ProductDiscoveryQuery
): Promise<ProductDiscoveryResult> {
  if (env.NEXT_PUBLIC_MEILISEARCH_HOST) {
    try {
      return await fetchDiscoveryResultFromMeilisearch(query);
    } catch (err) {
      // 搜索页（无 slug）无法降级到 Magento
      if (!query.slug) throw err;
      // TODO: remove after Meilisearch products index is live
      console.warn(
        '[discovery] Meilisearch unavailable, falling back to Magento:',
        err
      );
    }
  }

  // TODO: remove after Meilisearch products index is live
  if (!query.slug) {
    throw new Error(
      'Search page requires NEXT_PUBLIC_MEILISEARCH_HOST to be configured'
    );
  }
  return fetchDiscoveryResultFromMagento(query);
}
