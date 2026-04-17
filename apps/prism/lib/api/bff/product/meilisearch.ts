/**
 * BFF Product List 专用 Meilisearch 客户端
 *
 * 独立实现，不依赖 lib/api/discovery 层。
 * 索引名：products，主键：id（= sku）。
 */

import { env } from '@/lib/env';
import type { ProductCardItem } from './types';
import { fetchProductListFromMagento } from './magento-fallback';

const INDEX_UID = 'products';

// ─── Meilisearch 响应结构 ───────────────────────────────────────────────────────────────────

interface MeilisearchHit {
  id: string; // sku
  name: string;
  display_name?: string | null;
  url_key?: string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  price: number | null;
  special_price?: number | null;
  currency?: string | null;
  in_stock?: boolean;
  is_active?: boolean;
  type_id?: string | null;
  promotion_label?: string | null;
  review_count?: number;
  rating_percentage?: number;
}

interface MeilisearchSearchResponse {
  hits: MeilisearchHit[];
  totalHits: number;
  page: number;
  totalPages: number;
  hitsPerPage: number;
}

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

// ─── 工具函数 ──────────────────────────────────────────────────────────────────────────────────────────

function buildFilter(params: ProductMeilisearchParams): string[] {
  const filters: string[] = ['status = "1"', 'visibility = "4"'];

  if (params.categorySlug !== undefined) {
    filters.push(`category_slugs = "${params.categorySlug}"`);
  } else if (params.categoryId !== undefined) {
    filters.push(`category_ids = ${params.categoryId}`);
  } else if (params.categoryName !== undefined) {
    filters.push(`categories = "${params.categoryName}"`);
  }

  return filters;
}

function buildSort(sort?: 'name' | 'price'): string[] {
  switch (sort) {
    case 'name':
      return ['name:asc'];
    case 'price':
      return ['price:asc'];
    default:
      return [];
  }
}

function toProductCardItem(hit: MeilisearchHit): ProductCardItem {
  // 防御空字符串导致 Intl.NumberFormat 解析为 0 显示成 $0.00
  const regularPrice = hit.price !== '' && hit.price != null ? hit.price : null;
  const specialPrice =
    hit.special_price !== '' &&
    hit.special_price != null &&
    hit.special_price > 0
      ? hit.special_price
      : null;
  const displayPrice = specialPrice ?? regularPrice;
  const originalPrice =
    regularPrice != null && specialPrice != null && regularPrice > specialPrice
      ? regularPrice
      : null;

  return {
    sku: hit.id,
    name: hit.display_name ?? hit.name,
    displayName: hit.display_name ?? hit.name,
    urlKey: hit.url_key ?? null,
    image: hit.thumbnail_url ?? hit.image_url ?? hit.thumbnail ?? null,
    price: {
      value: displayPrice,
      currency: hit.currency ?? null,
    },
    originalPrice,
    inStock: hit.in_stock ?? true,
    type: hit.type_id ?? null,
    promotionLabel: hit.promotion_label ?? null,
    reviewCount: hit.review_count ?? 0,
    ratingPercentage: hit.rating_percentage ?? 0,
  };
}

// ─── 主函数 ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function searchProductsForBFF(
  params: ProductMeilisearchParams
): Promise<ProductMeilisearchResult> {
  const host = env.NEXT_PUBLIC_MEILISEARCH_HOST;
  const apiKey = env.MEILISEARCH_API_KEY;

  if (!host) {
    throw new Error('NEXT_PUBLIC_MEILISEARCH_HOST is not configured');
  }

  const page = params.page ?? 1;
  const hitsPerPage = params.pageSize ?? 24;

  const body: Record<string, unknown> = {
    q: '',
    filter: buildFilter(params),
    page,
    hitsPerPage,
  };

  const sortArr = buildSort(params.sort);
  if (sortArr.length > 0) {
    body.sort = sortArr;
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

    return {
      items: data.hits.map(toProductCardItem),
      pagination: {
        page: data.page,
        pageSize: data.hitsPerPage,
        total: data.totalHits,
        totalPages: data.totalPages,
      },
    };
  } catch (_error) {
    // Meilisearch 不可用时降级到 Magento
    return fetchProductListFromMagento({
      categoryId: params.categoryId,
      keyword: params.categoryName ?? params.categorySlug,
      page,
      pageSize: hitsPerPage,
    });
  }
}
