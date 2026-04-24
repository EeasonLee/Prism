import { processImageUrl } from '@prism/shared';
import { env } from '@/lib/env';
import { notifyError } from '@/lib/notify';
import type {
  UnifiedProductFilters,
  UnifiedProductQueryResult,
  UnifiedProductSortOption,
} from '@/lib/domain/product/query';
import type { ProductCardItem } from '@/lib/api/bff/product/types';

interface MeilisearchHit {
  id: string;
  sku?: string | null;
  name: string;
  display_name?: string | null;
  short_description?: string | null;
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
  brand?: string | null;
  size?: string | null;
  categories?: string[];
  category_ids?: number[];
  category_ancestor_ids?: number[];
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

function getIndexCandidates(): string[] {
  const explicit = env.MEILISEARCH_INDEX_NAME?.trim();
  if (explicit) return [explicit];

  const prefix = (env.MEILISEARCH_INDEX_PREFIX ?? '').trim();
  const store = (env.MAGENTO_STORE_CODE ?? '').trim();
  const primary = `${prefix}_${store}`;
  const fallback =
    prefix.endsWith('_product') || !prefix
      ? primary
      : `${prefix}_product_${store}`;
  return fallback === primary ? [primary] : [primary, fallback];
}

function buildFilter(
  filters: UnifiedProductFilters,
  magentoCategoryId?: number
): string[] {
  const result: string[] = [];
  if (typeof magentoCategoryId === 'number' && magentoCategoryId > 0) {
    result.push(
      `(category_ids = ${magentoCategoryId} OR category_ancestor_ids = ${magentoCategoryId})`
    );
  }
  if (filters.category) result.push(`categories = "${filters.category}"`);
  if (filters.brand) result.push(`brand = "${filters.brand}"`);
  if (filters.size) result.push(`size = "${filters.size}"`);
  if (filters.stockStatus)
    result.push(`stock_status = "${filters.stockStatus}"`);
  if (filters.priceMin !== undefined)
    result.push(`final_price >= ${filters.priceMin}`);
  if (filters.priceMax !== undefined)
    result.push(`final_price <= ${filters.priceMax}`);
  return result;
}

function buildSort(sort?: UnifiedProductSortOption): string[] {
  if (sort === 'price_asc') return ['final_price:asc'];
  if (sort === 'price_desc') return ['final_price:desc'];
  if (sort === 'newest') return ['content_updated_at:desc'];
  if (sort === 'name') return ['name:asc'];
  return [];
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
    sku: hit.id ?? hit.sku ?? '',
    name: hit.display_name ?? hit.name,
    displayName: hit.display_name ?? hit.name,
    shortDescription: hit.short_description ?? null,
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

function mapAvailableFilters(
  facetDistribution?: Record<string, Record<string, number>>
) {
  if (!facetDistribution) return [];
  const config = [
    { key: 'brand', label: 'Brand' },
    { key: 'size', label: 'Size' },
    { key: 'categories', label: 'Category' },
    { key: 'stock_status', label: 'Availability' },
  ] as const;
  return config
    .filter(item => facetDistribution[item.key])
    .map(item => ({
      key: item.key,
      label: item.label,
      options: Object.entries(facetDistribution[item.key]).map(
        ([value, count]) => ({
          value,
          label: value,
          count,
        })
      ),
    }));
}

type IndexSearchOutcome =
  | { kind: 'ok'; data: MeilisearchSearchResponse }
  | { kind: 'index_not_found' }
  | { kind: 'failed'; error: Error };

const FACET_FALLBACK_KEYS = ['brand', 'stock_status'] as const;

async function searchIndexWithFacetFallback(
  host: string,
  indexUid: string,
  headers: Record<string, string>,
  baseBody: Record<string, unknown>,
  facetKeys?: string[]
): Promise<IndexSearchOutcome> {
  const attempts: Array<Record<string, unknown>> = [];
  if (facetKeys && facetKeys.length > 0) {
    attempts.push({ ...baseBody, facets: facetKeys });

    const fallbackFacetKeys = FACET_FALLBACK_KEYS.filter(key =>
      facetKeys.includes(key)
    );
    if (
      fallbackFacetKeys.length > 0 &&
      fallbackFacetKeys.length < facetKeys.length
    ) {
      attempts.push({ ...baseBody, facets: fallbackFacetKeys });
    }
  }
  attempts.push({ ...baseBody });

  let lastError: Error | null = null;
  for (const body of attempts) {
    const response = await fetch(`${host}/indexes/${indexUid}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (response.ok) {
      return {
        kind: 'ok',
        data: (await response.json()) as MeilisearchSearchResponse,
      };
    }
    if (response.status === 404) {
      return { kind: 'index_not_found' };
    }
    const detail = await response.text();
    lastError = new Error(
      `Meilisearch ${response.status}: ${detail.slice(0, 240)}`
    );
  }
  return {
    kind: 'failed',
    error: lastError ?? new Error('Meilisearch search failed'),
  };
}

export async function searchProductsFromMeilisearch(params: {
  q?: string;
  magentoCategoryId?: number;
  page?: number;
  pageSize?: number;
  sort?: UnifiedProductSortOption;
  filters?: UnifiedProductFilters;
  facets?: string[];
}): Promise<UnifiedProductQueryResult> {
  const host = env.MEILISEARCH_HOST;
  if (!host) throw new Error('MEILISEARCH_HOST is not configured');

  const headers = {
    'Content-Type': 'application/json',
    ...(env.MEILISEARCH_API_KEY
      ? { Authorization: `Bearer ${env.MEILISEARCH_API_KEY}` }
      : {}),
  };

  const baseBody: Record<string, unknown> = {
    q: params.q ?? '',
    filter: buildFilter(params.filters ?? {}, params.magentoCategoryId),
    page: params.page ?? 1,
    hitsPerPage: params.pageSize ?? 24,
  };

  const sort = buildSort(params.sort);
  if (sort.length > 0) baseBody.sort = sort;

  const facetKeys =
    params.facets && params.facets.length > 0 ? params.facets : undefined;

  try {
    let last404Error: Error | null = null;
    for (const indexUid of getIndexCandidates()) {
      const outcome = await searchIndexWithFacetFallback(
        host,
        indexUid,
        headers,
        baseBody,
        facetKeys
      );
      if (outcome.kind === 'ok') {
        const data = outcome.data;
        return {
          items: data.hits.map(toProductCardItem),
          pagination: {
            page: data.page,
            pageSize: data.hitsPerPage,
            total: data.totalHits,
            totalPages: data.totalPages,
          },
          availableFilters: mapAvailableFilters(data.facetDistribution),
          resolvedMagentoCategoryId: params.magentoCategoryId,
        };
      }
      if (outcome.kind === 'index_not_found') {
        last404Error = new Error(`Meilisearch index not found: ${indexUid}`);
        continue;
      }
      throw outcome.error;
    }
    throw last404Error ?? new Error('No available Meilisearch index');
  } catch (error) {
    await notifyError({
      title: 'Unified Meilisearch Search Failed',
      message: JSON.stringify(params),
      error,
    });
    throw error;
  }
}

export async function searchProductBySkuFromMeilisearch(
  sku: string
): Promise<ProductCardItem | null> {
  const rows = await searchProductsFromMeilisearch({
    q: sku,
    page: 1,
    pageSize: 12,
  });
  const target = sku.trim().toLowerCase();
  return (
    rows.items.find(item => item.sku.trim().toLowerCase() === target) ?? null
  );
}

export async function searchProductsBySkusFromMeilisearch(
  skus: string[]
): Promise<ProductCardItem[]> {
  const uniqueSkus = [...new Set(skus.map(sku => sku.trim()).filter(Boolean))];
  if (uniqueSkus.length === 0) return [];

  const found = await Promise.all(
    uniqueSkus.map(sku => searchProductBySkuFromMeilisearch(sku))
  );
  return found.filter((item): item is ProductCardItem => item !== null);
}
