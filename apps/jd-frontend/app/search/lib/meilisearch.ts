/**
 * Search 页面专用 Meilisearch 客户端
 *
 * 索引名使用动态配置（默认 joydeem_product_en）
 * 主键：id（= sku）
 */

import { env } from '../../../lib/env';
import { notifyError } from '../../../lib/notify';
import type {
  SearchSortOption,
  ProductCardItem,
  SearchPagination,
} from '../types';

const INDEX_UID =
  env.MEILISEARCH_INDEX_NAME ??
  `${env.MEILISEARCH_INDEX_PREFIX}_${env.MAGENTO_STORE_CODE}`;

// ――― Meilisearch 响应结构 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

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

// ――― 查询参数与结果类型 ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export interface MeilisearchSearchParams {
  q?: string;
  slug?: string;
  brand?: string;
  size?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: SearchSortOption;
  page?: number;
  pageSize?: number;
  facets?: string[];
}

export interface MeilisearchSearchResult {
  items: ProductCardItem[];
  pagination: SearchPagination;
  facetDistribution?: Record<string, Record<string, number>>;
}

// ――― 工具函数 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

function buildFilter(params: MeilisearchSearchParams): string[] {
  const filters: string[] = [];

  if (params.category) {
    filters.push(`categories = "${params.category}"`);
  }
  if (params.brand) {
    filters.push(`brand = "${params.brand}"`);
  }
  if (params.size) {
    filters.push(`size = "${params.size}"`);
  }
  if (params.priceMin !== undefined) {
    filters.push(`price >= ${params.priceMin}`);
  }
  if (params.priceMax !== undefined) {
    filters.push(`price <= ${params.priceMax}`);
  }

  return filters;
}

function buildSort(sort?: SearchSortOption): string[] {
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
    name: hit.display_name ?? hit.name,
    subtitle: hit.subtitle ?? undefined,
    thumbnail: hit.thumbnail_url ?? hit.thumbnail ?? undefined,
    price: hit.special_price ?? hit.price,
    in_stock: hit.in_stock ?? true,
    promotion_label: hit.promotion_label ?? undefined,
    href: hit.href ?? `/products/${encodeURIComponent(hit.url_key ?? hit.id)}`,
  };
}

// ――― 主函数 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export async function searchProducts(
  params: MeilisearchSearchParams
): Promise<MeilisearchSearchResult> {
  const host = env.MEILISEARCH_HOST;
  const apiKey = env.MEILISEARCH_API_KEY;

  if (!host) {
    throw new Error('MEILISEARCH_HOST is not configured');
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
      facetDistribution: data.facetDistribution,
    };
  } catch (error) {
    await notifyError({
      title: 'Meilisearch Search Failed',
      message: `Search failed for query: ${params.q ?? ''}, slug: ${
        params.slug ?? ''
      }`,
      error,
    });
    throw error;
  }
}
