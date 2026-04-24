import { env } from '../../../lib/env';
import { notifyError } from '../../../lib/notify';
import type { ProductCardItem } from '../../../lib/api/bff/product/types';
import { processImageUrl } from '@prism/shared';

function getIndexCandidates(): string[] {
  const explicit = env.MEILISEARCH_INDEX_NAME?.trim();
  if (explicit) {
    return [explicit];
  }

  const prefix = (env.MEILISEARCH_INDEX_PREFIX ?? '').trim();
  const store = (env.MAGENTO_STORE_CODE ?? '').trim();
  const primary = `${prefix}_${store}`;
  const fallback =
    prefix.endsWith('_product') || !prefix
      ? primary
      : `${prefix}_product_${store}`;

  return fallback === primary ? [primary] : [primary, fallback];
}

export type ShopSortOption = 'featured' | 'price_asc' | 'price_desc' | 'newest';

export interface ShopSearchParams {
  q?: string;
  slug?: string;
  brand?: string;
  size?: string;
  stockStatus?: string;
  category?: string;
  categorySlug?: string;
  categoryId?: number;
  priceMin?: number;
  priceMax?: number;
  sort?: ShopSortOption;
  page?: number;
  pageSize?: number;
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

interface MeilisearchHit {
  id: string;
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
  type_id?: string | null;
  promotion_label?: string | null;
  review_count?: number;
  rating_summary?: number;
  rating_percentage?: number;
  content_updated_at?: number;
}

interface MeilisearchSearchResponse {
  hits: MeilisearchHit[];
  totalHits: number;
  page: number;
  totalPages: number;
  hitsPerPage: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

function buildFilter(p: ShopSearchParams): string[] {
  const f: string[] = [];
  if (p.categoryId !== undefined) {
    // 兼容索引映射差异：
    // - category_ids: 商品直属分类
    // - category_ancestor_ids: 祖先分类（用于父类聚合）
    // 仅使用其中一个字段会导致部分分类页查不到商品。
    f.push(
      `(category_ids = ${p.categoryId} OR category_ancestor_ids = ${p.categoryId})`
    );
  }
  // NOTE: category_ancestor_slugs / category_slugs are not reliably populated.
  if (p.brand !== undefined) f.push(`brand = "${p.brand}"`);
  if (p.size !== undefined) f.push(`size = "${p.size}"`);
  if (p.stockStatus !== undefined) f.push(`stock_status = "${p.stockStatus}"`);
  if (p.priceMin !== undefined) f.push(`final_price >= ${p.priceMin}`);
  if (p.priceMax !== undefined) f.push(`final_price <= ${p.priceMax}`);
  return f;
}

function buildSort(sort?: ShopSortOption): string[] {
  const s: string[] = [];
  if (sort === 'price_asc') {
    s.push('final_price:asc');
  } else if (sort === 'price_desc') {
    s.push('final_price:desc');
  } else if (sort === 'newest') {
    s.push('content_updated_at:desc');
  }
  return s;
}

function moveOutOfStockToEnd(hits: MeilisearchHit[]): MeilisearchHit[] {
  const inStock: MeilisearchHit[] = [];
  const outOfStock: MeilisearchHit[] = [];

  for (const hit of hits) {
    const isOutOfStock =
      hit.is_in_stock === false || hit.stock_status === 'out_of_stock';
    if (isOutOfStock) {
      outOfStock.push(hit);
    } else {
      inStock.push(hit);
    }
  }

  return [...inStock, ...outOfStock];
}

function toProductCardItem(hit: MeilisearchHit): ProductCardItem {
  const rawPrice = hit.price != null ? Number(hit.price) : null;
  const rawFinal = hit.final_price != null ? Number(hit.final_price) : null;
  const displayPrice = rawFinal != null && rawFinal > 0 ? rawFinal : rawPrice;
  const originalPrice =
    rawFinal != null && rawPrice != null && rawFinal > 0 && rawFinal < rawPrice
      ? rawPrice
      : null;

  const rawImage = hit.thumbnail_url ?? hit.image_url ?? hit.thumbnail ?? null;
  const image =
    rawImage && /^https?:\/\//i.test(rawImage)
      ? rawImage
      : processImageUrl(rawImage) ?? rawImage;

  return {
    sku: hit.id,
    name: hit.display_name ?? hit.name,
    displayName: hit.display_name ?? hit.name,
    urlKey: hit.url_key ?? null,
    image,
    price: { value: displayPrice, currency: hit.currency ?? null },
    originalPrice,
    inStock: hit.is_in_stock ?? hit.stock_status !== 'out_of_stock',
    type: hit.type_id ?? null,
    promotionLabel: hit.promotion_label ?? null,
    reviewCount: hit.review_count ?? 0,
    ratingPercentage: hit.rating_summary ?? hit.rating_percentage ?? 0,
  };
}

const FACET_CONFIG = [
  { key: 'brand', label: 'Brand' },
  { key: 'stock_status', label: 'Availability' },
] as const;

function buildAvailableFilters(
  fd?: Record<string, Record<string, number>>
): ShopAvailableFilter[] {
  if (!fd) return [];
  return FACET_CONFIG.filter(c => fd[c.key]).map(c => ({
    key: c.key,
    label: c.label,
    options: Object.entries(fd[c.key]).map(([value, count]) => ({
      value,
      label: value,
      count,
    })),
  }));
}

export async function searchProducts(
  params: ShopSearchParams
): Promise<ShopSearchResult> {
  const host = env.MEILISEARCH_HOST;
  if (!host) throw new Error('MEILISEARCH_HOST is not configured');

  const page = params.page ?? 1;
  const hitsPerPage = params.pageSize ?? 24;

  const body = {
    q: params.q ?? '',
    filter: buildFilter(params),
    sort: buildSort(params.sort),
    facets: FACET_CONFIG.map(c => c.key),
    page,
    hitsPerPage,
  };

  try {
    const indexCandidates = getIndexCandidates();
    let last404Error: Error | null = null;

    for (const indexUid of indexCandidates) {
      const headers = {
        'Content-Type': 'application/json',
        ...(env.MEILISEARCH_API_KEY
          ? { Authorization: `Bearer ${env.MEILISEARCH_API_KEY}` }
          : {}),
      };

      const res = await fetch(`${host}/indexes/${indexUid}/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.status === 404) {
        last404Error = new Error(`Meilisearch index not found: ${indexUid}`);
        continue;
      }

      if (!res.ok)
        throw new Error(`Meilisearch ${res.status}: ${res.statusText}`);

      const data = (await res.json()) as MeilisearchSearchResponse;
      const shouldUseDefaultOrder =
        params.sort === undefined || params.sort === 'featured';
      const orderedHits = shouldUseDefaultOrder
        ? moveOutOfStockToEnd(data.hits)
        : data.hits;
      return {
        items: orderedHits.map(toProductCardItem),
        pagination: {
          page: data.page,
          pageSize: data.hitsPerPage,
          total: data.totalHits,
          totalPages: data.totalPages,
        },
        availableFilters: buildAvailableFilters(data.facetDistribution),
      };
    }

    throw last404Error ?? new Error('No available Meilisearch index');
  } catch (error) {
    await notifyError({
      title: 'Meilisearch Search Failed',
      message: JSON.stringify(params),
      error,
    });
    throw error;
  }
}
