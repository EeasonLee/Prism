import { env } from '../../../lib/env';
import { notifyError } from '../../../lib/notify';
import type { ProductCardItem } from '../../../lib/api/bff/product/types';

const INDEX_UID =
  env.MEILISEARCH_INDEX_NAME ??
  `${env.MEILISEARCH_INDEX_PREFIX}_${env.MAGENTO_STORE_CODE}`;

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
  thumbnail_url?: string | null;
  image_url?: string | null;
  price: string | number | null;
  final_price?: string | number | null;
  currency?: string | null;
  stock_status?: string | null;
  is_in_stock?: boolean;
  type_id?: string | null;
  promotion_label?: string | null;
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
  if (p.categoryId !== undefined)
    f.push(`category_ancestor_ids = ${p.categoryId}`);
  // NOTE: category_ancestor_slugs / category_slugs are not reliably populated
  // in the Meilisearch index, so we only filter by category_ancestor_ids.
  if (p.brand !== undefined) f.push(`brand = "${p.brand}"`);
  if (p.size !== undefined) f.push(`size = "${p.size}"`);
  if (p.stockStatus !== undefined) f.push(`stock_status = "${p.stockStatus}"`);
  if (p.priceMin !== undefined) f.push(`final_price >= ${p.priceMin}`);
  if (p.priceMax !== undefined) f.push(`final_price <= ${p.priceMax}`);
  return f;
}

function buildSort(sort?: ShopSortOption): string[] {
  const s: string[] = [];
  if (sort === 'price_asc') s.push('final_price:asc');
  else if (sort === 'price_desc') s.push('final_price:desc');
  else if (sort === 'newest') s.push('content_updated_at:desc');
  return s;
}

function toProductCardItem(hit: MeilisearchHit): ProductCardItem {
  const rawPrice = hit.price != null ? Number(hit.price) : null;
  const rawFinal = hit.final_price != null ? Number(hit.final_price) : null;
  const displayPrice = rawFinal != null && rawFinal > 0 ? rawFinal : rawPrice;
  const originalPrice =
    rawFinal != null && rawPrice != null && rawFinal > 0 && rawFinal < rawPrice
      ? rawPrice
      : null;

  return {
    sku: hit.id,
    name: hit.display_name ?? hit.name,
    displayName: hit.display_name ?? hit.name,
    urlKey: hit.url_key ?? null,
    image: hit.thumbnail_url ?? hit.image_url ?? null,
    price: { value: displayPrice, currency: hit.currency ?? null },
    originalPrice,
    inStock: hit.is_in_stock ?? hit.stock_status !== 'out_of_stock',
    type: hit.type_id ?? null,
    promotionLabel: hit.promotion_label ?? null,
    reviewCount: 0,
    ratingPercentage: 0,
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
    const res = await fetch(`${host}/indexes/${INDEX_UID}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.MEILISEARCH_API_KEY
          ? { Authorization: `Bearer ${env.MEILISEARCH_API_KEY}` }
          : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok)
      throw new Error(`Meilisearch ${res.status}: ${res.statusText}`);
    const data = (await res.json()) as MeilisearchSearchResponse;

    return {
      items: data.hits.map(toProductCardItem),
      pagination: {
        page: data.page,
        pageSize: data.hitsPerPage,
        total: data.totalHits,
        totalPages: data.totalPages,
      },
      availableFilters: buildAvailableFilters(data.facetDistribution),
    };
  } catch (error) {
    await notifyError({
      title: 'Meilisearch Search Failed',
      message: JSON.stringify(params),
      error,
    });
    throw error;
  }
}
