/**
 * Meilisearch 商品检索客户端
 *
 * 使用原生 fetch 调用 Meilisearch REST API，封装商品索引查询逻辑。
 * 索引名：products
 * 主键：id（= sku）
 */

import { env } from '../../env';
import type {
  DiscoverySortOption,
  ProductCardItem,
  DiscoveryPagination,
} from './types';

const INDEX_UID = 'products';

// ─── Meilisearch 响应结构 ──────────────────────────────────────────────────────

interface MeilisearchHit {
  id: string; // sku
  name: string;
  subtitle?: string | null;
  brand?: string | null;
  promotion_label?: string | null;
  discovery_category_slugs?: string[];
  thumbnail?: string | null;
  href?: string | null;
  price: number | null;
  special_price?: number | null;
  in_stock?: boolean;
  is_active?: boolean;
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

// ─── 查询参数与结果类型 ────────────────────────────────────────────────────────

export interface MeilisearchSearchParams {
  q?: string;
  slug?: string;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: DiscoverySortOption;
  page?: number;
  pageSize?: number;
  facets?: string[];
}

export interface MeilisearchSearchResult {
  items: ProductCardItem[];
  pagination: DiscoveryPagination;
  facetDistribution?: Record<string, Record<string, number>>;
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function buildFilter(params: MeilisearchSearchParams): string[] {
  const filters: string[] = ['is_active = true'];

  if (params.slug) {
    filters.push(`discovery_category_slugs = "${params.slug}"`);
  }
  if (params.brand) {
    filters.push(`brand = "${params.brand}"`);
  }
  if (params.priceMin !== undefined) {
    filters.push(`price >= ${params.priceMin}`);
  }
  if (params.priceMax !== undefined) {
    filters.push(`price <= ${params.priceMax}`);
  }

  return filters;
}

function buildSort(sort?: DiscoverySortOption): string[] {
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

function toProductCardItem(hit: MeilisearchHit): ProductCardItem {
  return {
    sku: hit.id,
    name: hit.name,
    subtitle: hit.subtitle ?? undefined,
    thumbnail: hit.thumbnail ?? undefined,
    price: hit.special_price ?? hit.price,
    in_stock: hit.in_stock ?? true,
    promotion_label: hit.promotion_label ?? undefined,
    href: hit.href ?? `/products/${encodeURIComponent(hit.id)}`,
  };
}

// ─── 主函数 ───────────────────────────────────────────────────────────────────

export async function searchProducts(
  params: MeilisearchSearchParams
): Promise<MeilisearchSearchResult> {
  const host = env.NEXT_PUBLIC_MEILISEARCH_HOST;
  const apiKey = env.MEILISEARCH_API_KEY;

  if (!host) {
    throw new Error('NEXT_PUBLIC_MEILISEARCH_HOST is not configured');
  }

  const page = params.page ?? 1;
  const hitsPerPage = params.pageSize ?? 24;

  const body: Record<string, unknown> = {
    q: params.q ?? '',
    filter: buildFilter(params),
    page,
    hitsPerPage,
  };

  const sortArr = buildSort(params.sort);
  if (sortArr.length > 0) {
    body.sort = sortArr;
  }

  if (params.facets && params.facets.length > 0) {
    body.facets = params.facets;
  }

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
    facetDistribution: data.facetDistribution,
  };
}
