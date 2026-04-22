/**
 * BFF Product List 专用 Meilisearch 客户端
 *
 * 独立实现，不依赖 lib/api/discovery 层。
 * 索引名使用动态配置或覆盖值。
 */

import { env } from '../../../env';
import { notifyError } from '../../../notify';
import type { ProductCardItem } from './types';

const INDEX_UID =
  env.MEILISEARCH_INDEX_NAME ??
  `${env.MEILISEARCH_INDEX_PREFIX}_${env.MAGENTO_STORE_CODE}`;

// ─── Meilisearch 响应结构 ───────────────────────────────────────────────────────────────────

interface MeilisearchHit {
  id: string; // sku
  name: string;
  display_name?: string | null;
  url_key?: string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  price: string | number | null;
  final_price?: string | number | null;
  currency?: string | null;
  stock_status?: string | null;
  is_in_stock?: boolean;
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
  const filters: string[] = [];

  // 兼容不同索引字段：
  // - category_ids: 直属分类
  // - category_ancestor_ids: 祖先分类
  // 任一字段命中即可，避免叶子分类漏数。
  if (params.categoryId !== undefined) {
    filters.push(
      `(category_ids = ${params.categoryId} OR category_ancestor_ids = ${params.categoryId})`
    );
  } else if (params.categorySlug !== undefined) {
    // 后备：等待 catalog-sync-service 填充 category_slugs 后恢复使用
    filters.push(`category_slugs = "${params.categorySlug}"`);
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
  // joydeem_product_en 索引已包含实时价格和库存
  const rawPrice =
    hit.price != null && hit.price !== '' ? Number(hit.price) : null;
  const rawFinalPrice =
    hit.final_price != null && hit.final_price !== ''
      ? Number(hit.final_price)
      : null;

  const displayPrice =
    rawFinalPrice != null && rawFinalPrice > 0 ? rawFinalPrice : rawPrice;
  const originalPrice =
    rawFinalPrice != null &&
    rawPrice != null &&
    rawFinalPrice > 0 &&
    rawFinalPrice < rawPrice
      ? rawPrice
      : null;

  const inStock = hit.is_in_stock ?? hit.stock_status !== 'out_of_stock';

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
    inStock,
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
  const host = env.MEILISEARCH_HOST;
  const apiKey = env.MEILISEARCH_API_KEY;

  if (!host) {
    throw new Error('MEILISEARCH_HOST is not configured');
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
  } catch (error) {
    await notifyError({
      title: 'Meilisearch BFF Search Failed',
      message: `BFF search failed for categoryId: ${
        params.categoryId ?? ''
      }, slug: ${params.categorySlug ?? ''}`,
      error,
    });
    throw error;
  }
}
