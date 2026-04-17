/**
 * Shop 页面专用 Meilisearch 客户端
 * 不依赖 lib/api/discovery，直接调用 Meilisearch REST API
 */

import { env } from '@/lib/env';
import type { ProductCardItem } from '../../../lib/api/bff/product/types';
import {
  fetchPricesStock,
  type PriceStockDocument,
} from '../../../lib/api/bff/product/catalog-sync.client';
import { fetchProductListFromMagento } from '../../../lib/api/bff/product/magento-fallback';

const INDEX_UID = 'products';

export type ShopSortOption = 'featured' | 'price_asc' | 'price_desc' | 'newest';

export interface ShopSearchParams {
  q?: string;
  slug?: string;
  brand?: string;
  size?: string;
  category?: string;
  categorySlug?: string;
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  sort?: ShopSortOption;
  page?: number;
  pageSize?: number;
  facets?: string[];
}

export interface ShopPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ShopFilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface ShopAvailableFilter {
  key: string;
  label: string;
  options: ShopFilterOption[];
}

export interface ShopSearchResult {
  items: ProductCardItem[];
  pagination: ShopPagination;
  availableFilters: ShopAvailableFilter[];
}

// ─── Meilisearch 响应结构 ──────────────────────────────────────────────────────

interface MeilisearchHit {
  id: string; // sku
  name: string;
  display_name?: string | null;
  url_key?: string | null;
  subtitle?: string | null;
  brand?: string | null;
  size?: string | null;
  categories?: string[];
  promotion_label?: string | null;
  discovery_category_slugs?: string[];
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  href?: string | null;
  price: number | null;
  special_price?: number | null;
  currency?: string | null;
  in_stock?: boolean;
  is_active?: boolean;
  type_id?: string | null;
  created_at?: number;
}

interface MeilisearchSearchResponse {
  hits: MeilisearchHit[];
  totalHits: number;
  page: number;
  totalPages: number;
  hitsPerPage: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function buildFilter(params: ShopSearchParams): string[] {
  const filters: string[] = ['status = "1"', 'visibility = "4"'];

  if (params.slug) {
    filters.push(`discovery_category_slugs = "${params.slug}"`);
  }
  if (params.category) {
    filters.push(`categories = "${params.category}"`);
  }
  if (params.categorySlug) {
    filters.push(`category_slugs = "${params.categorySlug}"`);
  }
  if (params.brand) {
    filters.push(`brand = "${params.brand}"`);
  }
  if (params.size) {
    filters.push(`size = "${params.size}"`);
  }
  // 价格过滤在 Meilisearch 索引中经常为空，改为在 enrich 后做客户端过滤
  // 以保证使用 catalog-sync-service 返回的实时价格

  return filters;
}

function _buildSort(sort?: ShopSortOption): string[] {
  switch (sort) {
    case 'price_asc':
      return ['price:asc'];
    case 'price_desc':
      return ['price:desc'];
    case 'newest':
      return ['created_at:desc'];
    case 'featured':
    default:
      return [];
  }
}

function mergePriceStock(
  item: ProductCardItem,
  doc: PriceStockDocument | null
): ProductCardItem {
  if (!doc) {
    return item;
  }

  const regularPrice = doc.price;
  const specialPrice =
    doc.special_price != null && doc.special_price > 0
      ? doc.special_price
      : null;
  const displayPrice = specialPrice ?? regularPrice;
  const originalPrice =
    specialPrice != null && regularPrice > specialPrice ? regularPrice : null;

  return {
    ...item,
    price: {
      value: displayPrice,
      currency: item.price.currency,
    },
    originalPrice,
    inStock: doc.stock_status === 'in_stock',
  };
}

function toProductCardItem(hit: MeilisearchHit): ProductCardItem {
  // 防御空字符串导致 Intl.NumberFormat 解析为 0 显示成 $0.00
  const rawPrice = hit.price !== '' ? hit.price : null;
  const rawSpecialPrice =
    hit.special_price !== '' &&
    hit.special_price != null &&
    hit.special_price > 0
      ? hit.special_price
      : null;

  return {
    sku: hit.id,
    name: hit.display_name ?? hit.name,
    displayName: hit.display_name ?? hit.name,
    urlKey: hit.url_key ?? null,
    image: hit.thumbnail_url ?? hit.image_url ?? hit.thumbnail ?? null,
    price: {
      value: rawSpecialPrice ?? rawPrice,
      currency: hit.currency ?? null,
    },
    originalPrice: rawPrice,
    inStock: hit.in_stock ?? true,
    type: hit.type_id ?? null,
    promotionLabel: hit.promotion_label ?? null,
    reviewCount: 0,
    ratingPercentage: 0,
    createdAt: hit.created_at ?? undefined,
  };
}

function filterByPriceRange(
  items: ProductCardItem[],
  priceMin?: number,
  priceMax?: number
): ProductCardItem[] {
  return items.filter(item => {
    const price = item.price.value;
    if (price == null) return false;
    if (priceMin !== undefined && price < priceMin) return false;
    if (priceMax !== undefined && price > priceMax) return false;
    return true;
  });
}

function sortShopItems(
  items: ProductCardItem[],
  sort?: ShopSortOption
): ProductCardItem[] {
  return [...items].sort((a, b) => {
    // 1. 有库存的排前面
    if (a.inStock && !b.inStock) return -1;
    if (!a.inStock && b.inStock) return 1;

    // 2. 同库存状态下按指定排序
    switch (sort) {
      case 'price_asc':
        return (a.price.value ?? Infinity) - (b.price.value ?? Infinity);
      case 'price_desc':
        return (b.price.value ?? -Infinity) - (a.price.value ?? -Infinity);
      case 'newest':
        return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      case 'featured':
      default:
        return 0;
    }
  });
}

function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; pagination: ShopPagination } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
  };
}

function buildAvailableFilters(
  facetDistribution?: Record<string, Record<string, number>>
): ShopAvailableFilter[] {
  if (!facetDistribution) return [];

  const filters: ShopAvailableFilter[] = [];

  if (facetDistribution.brand) {
    filters.push({
      key: 'brand',
      label: 'Brand',
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

// ─── 主函数 ───────────────────────────────────────────────────────────────────

export async function searchShopProducts(
  params: ShopSearchParams
): Promise<ShopSearchResult> {
  const host = env.NEXT_PUBLIC_MEILISEARCH_HOST;
  const apiKey = env.MEILISEARCH_API_KEY;

  if (!host) {
    throw new Error('NEXT_PUBLIC_MEILISEARCH_HOST is not configured');
  }

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;

  // 一次性获取全部符合条件的产品（用于在服务端手动排序和分页）
  const body: Record<string, unknown> = {
    q: params.q ?? '',
    filter: buildFilter(params),
    page: 1,
    hitsPerPage: 1000,
  };

  if (params.facets && params.facets.length > 0) {
    body.facets = params.facets;
  }

  try {
    const response = await fetch(`${host}/indexes/${INDEX_UID}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Meilisearch search failed: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as MeilisearchSearchResponse;

    const baseItems = data.hits.map(toProductCardItem);
    const skus = baseItems.map(item => item.sku);

    // 批量调用 catalog-sync-service 补充实时价格和库存（每次最多 100 个 SKU）
    const skuBatches: string[][] = [];
    for (let i = 0; i < skus.length; i += 100) {
      skuBatches.push(skus.slice(i, i + 100));
    }

    const pricesStockResults = await Promise.all(
      skuBatches.map(batch => fetchPricesStock(batch))
    ).then(results =>
      results.reduce<Record<string, PriceStockDocument | null>>(
        (acc, result) => ({ ...acc, ...result }),
        {}
      )
    );

    const mergedItems = baseItems.map(item => {
      const doc = pricesStockResults[item.sku] ?? null;
      return mergePriceStock(item, doc);
    });

    const priceFilteredItems = filterByPriceRange(
      mergedItems,
      params.priceMin,
      params.priceMax
    );

    const sortedItems = sortShopItems(priceFilteredItems, params.sort);
    const paginated = paginateItems(sortedItems, page, pageSize);

    return {
      items: paginated.items,
      pagination: paginated.pagination,
      availableFilters: buildAvailableFilters(data.facetDistribution),
    };
  } catch (_error) {
    // Meilisearch 或 catalog-sync 不可用时降级到 Magento
    const fallback = await fetchProductListFromMagento({
      categoryId: params.categoryId,
      keyword: params.q,
      page,
      pageSize,
    });

    return {
      items: fallback.items,
      pagination: fallback.pagination,
      availableFilters: [],
    };
  }
}
