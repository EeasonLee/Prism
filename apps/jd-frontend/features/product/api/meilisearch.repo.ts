import { resolveImageUrl } from '@/infrastructure/config/image';
import { env } from '@/infrastructure/config/env';
import { notifyError } from '@/infrastructure/observability/notify';
import { meilisearchClient } from '@/infrastructure/api/clients/meilisearch';
import { isApiError } from '@/infrastructure/api/errors';
import type {
  UnifiedProductFilters,
  UnifiedProductQueryResult,
  UnifiedProductSortOption,
} from '../services/query.model';
import type { ProductCardItem } from '../bff-types';

interface MeilisearchHit {
  id: string;
  sku?: string | null;
  name: string;
  short_name?: string | null;
  long_title?: string | null;
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
  cp_label?: string | null;
  cp_label_color?: string | null;
  review_count?: number;
  rating_summary?: number;
  rating_percentage?: number;
  brand?: string | null;
  size?: string | null;
  categories?: string[];
  category_ids?: number[];
  category_ancestor_ids?: number[];
  content_updated_at?: number;
  configurable_options?: Array<{
    attribute_id?: string | number;
    attribute_code: string;
    label: string;
    values: Array<{ value_index: string | number; label: string }>;
  }>;
  configurable_children?: Array<{
    sku: string;
    price: number;
    final_price: number;
    is_in_stock: boolean;
    image_url: string | null;
    option_values: Record<string, string>;
  }>;
  custom_options?: Array<{
    option_id: number;
    title: string;
    type: string;
    required: boolean;
    sort_order?: number;
    max_characters?: number | null;
    values?: Array<{
      option_type_id: number;
      title: string;
      price: number;
      price_type: string;
      sku: string;
      sort_order: number;
    }>;
  }>;
  parent_sku?: string | null;
  parent_url?: string | null;
  parent_configurable_options?: Array<{
    attribute_id?: string | number;
    attribute_code?: string | null;
    label?: string | null;
    values?: Array<{ value_index?: string | number; label?: string | null }>;
  }>;
  parent_custom_options?: Array<{
    option_id?: number;
    title?: string | null;
    type?: string | null;
    required?: boolean;
    values?: Array<{
      option_type_id?: number;
      title?: string | null;
      price?: number;
      price_type?: string | null;
      sku?: string | null;
      sort_order?: number;
    }>;
  }>;
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
  return [`${prefix}_product_${store}`];
}

function buildFilter(
  filters: UnifiedProductFilters,
  magentoCategoryId?: number
): string[] {
  const result: string[] = [];
  if (typeof magentoCategoryId === 'number' && magentoCategoryId > 0) {
    // 线上索引当前仅保证提供 category_ids（值即 Magento category id）。
    // 若过滤表达式引用不存在/不可过滤字段（如 category_ancestor_ids），Meilisearch 会直接报错。
    result.push(`category_ids = ${magentoCategoryId}`);
  }
  if (filters.category) result.push(`category_slugs = "${filters.category}"`);
  if (filters.brand) result.push(`manufacturer = "${filters.brand}"`);
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
      : resolveImageUrl(rawImage) ?? rawImage;

  return {
    sku: hit.sku ?? hit.id ?? '',
    name: hit.display_name ?? hit.name,
    displayName: hit.display_name ?? hit.name,
    shortName: hit.short_name ?? null,
    longTitle: hit.long_title ?? null,
    shortDescription: hit.short_description ?? null,
    urlKey: hit.url_key ?? null,
    image,
    price: { value: displayPrice, currency: hit.currency ?? null },
    originalPrice,
    inStock: hit.is_in_stock ?? hit.stock_status !== 'out_of_stock',
    type: hit.type_id ?? null,
    promotionLabel: hit.promotion_label ?? null,
    cpLabel: hit.cp_label?.trim() ? hit.cp_label.trim() : null,
    cpLabelColor: hit.cp_label_color?.trim() ? hit.cp_label_color.trim() : null,
    reviewCount: hit.review_count ?? 0,
    ratingPercentage: hit.rating_summary ?? hit.rating_percentage ?? 0,
  };
}

function mapAvailableFilters(
  facetDistribution?: Record<string, Record<string, number>>
) {
  if (!facetDistribution) return [];
  const config = [
    { key: 'manufacturer', label: 'Brand' },
    { key: 'category_slugs', label: 'Category' },
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

const FACET_FALLBACK_KEYS = ['manufacturer', 'stock_status'] as const;

function hasFacetData(
  facetDistribution?: Record<string, Record<string, number>>
): boolean {
  return Boolean(
    facetDistribution && Object.keys(facetDistribution).length > 0
  );
}

function mergeFacetDistributions(
  base: Record<string, Record<string, number>>,
  extra?: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  if (!extra) return base;
  for (const [facetKey, values] of Object.entries(extra)) {
    if (!base[facetKey]) {
      base[facetKey] = { ...values };
      continue;
    }
    for (const [value, count] of Object.entries(values)) {
      const current = base[facetKey][value] ?? 0;
      base[facetKey][value] = Math.max(current, count);
    }
  }
  return base;
}

async function recoverFacetDistributionBySingleKeys(
  host: string,
  indexUid: string,
  headers: Record<string, string>,
  baseBody: Record<string, unknown>,
  facetKeys: string[]
): Promise<Record<string, Record<string, number>> | undefined> {
  const recovered: Record<string, Record<string, number>> = {};

  for (const facetKey of facetKeys) {
    const outcome = await searchIndexWithFacetFallback(
      host,
      indexUid,
      headers,
      baseBody,
      [facetKey]
    );
    if (outcome.kind !== 'ok') continue;
    mergeFacetDistributions(recovered, outcome.data.facetDistribution);
  }

  return Object.keys(recovered).length > 0 ? recovered : undefined;
}

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
    try {
      const data = await meilisearchClient.post<MeilisearchSearchResponse>(
        `/indexes/${indexUid}/search`,
        { body }
      );
      return { kind: 'ok', data };
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        return { kind: 'index_not_found' };
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }
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
        let facetDistribution = data.facetDistribution;

        // 某些索引配置下，批量 facets 请求会失败并回退到无 facets 查询，导致筛选项全空。
        // 这里做单字段补偿探测，尽量恢复可用筛选。
        if (!hasFacetData(facetDistribution) && facetKeys?.length) {
          const recovered = await recoverFacetDistributionBySingleKeys(
            host,
            indexUid,
            headers,
            baseBody,
            facetKeys
          );
          if (recovered) {
            facetDistribution = recovered;
          }
        }

        return {
          items: data.hits.map(toProductCardItem),
          pagination: {
            page: data.page,
            pageSize: data.hitsPerPage,
            total: data.totalHits,
            totalPages: data.totalPages,
          },
          availableFilters: mapAvailableFilters(facetDistribution),
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

// ─── Cart enrichment types ───────────────────────────────────────────────────

export interface CartProductEnrichment {
  sku: string;
  name: string;
  image: string | null;
  configurable_options: Array<{
    attribute_id: string;
    attribute_code: string;
    label: string;
    values: Array<{ value_index: string; label: string }>;
  }>;
  custom_options: Array<{
    option_id: number;
    title: string;
    type: string;
    required: boolean;
    values?: Array<{
      option_type_id: number;
      title: string;
      price: number;
      price_type: string;
      sku: string;
      sort_order: number;
    }>;
  }>;
  variants: Array<{
    sku: string;
    price: number;
    final_price: number;
    is_in_stock: boolean;
    image_url: string | null;
    option_values: Record<string, string>;
  }>;
  url_key: string | null;
  parent_sku: string | null;
  parent_url: string | null;
  parent_configurable_options: Array<{
    attribute_id: string;
    attribute_code: string;
    label: string;
    values: Array<{ value_index: string; label: string }>;
  }> | null;
  parent_custom_options: Array<{
    option_id: number;
    title: string;
    type: string;
    required: boolean;
    values?: Array<{
      option_type_id: number;
      title: string;
      price: number;
      price_type: string;
      sku: string;
      sort_order: number;
    }>;
  }> | null;
}

function hitToCartEnrichment(hit: MeilisearchHit): CartProductEnrichment {
  return {
    sku: hit.sku ?? hit.id ?? '',
    name: hit.name ?? '',
    image: hit.thumbnail_url ?? hit.image_url ?? hit.thumbnail ?? null,
    url_key: hit.url_key ?? null,
    configurable_options: (hit.configurable_options ?? []).map(opt => ({
      attribute_id: String(opt.attribute_id ?? ''),
      attribute_code: opt.attribute_code ?? '',
      label: opt.label ?? '',
      values: (opt.values ?? []).map(v => ({
        value_index: String(v.value_index ?? ''),
        label: v.label ?? '',
      })),
    })),
    custom_options: (hit.custom_options ?? []).map(opt => ({
      option_id: opt.option_id ?? 0,
      title: opt.title ?? '',
      type: opt.type ?? '',
      required: opt.required ?? false,
      values: (opt.values ?? []).map(v => ({
        option_type_id: v.option_type_id ?? 0,
        title: v.title ?? '',
        price: v.price ?? 0,
        price_type: v.price_type ?? 'fixed',
        sku: v.sku ?? '',
        sort_order: v.sort_order ?? 0,
      })),
    })),
    variants: (hit.configurable_children ?? []).map(child => ({
      sku: child.sku,
      price: child.price ?? 0,
      final_price: child.final_price ?? child.price ?? 0,
      is_in_stock: child.is_in_stock ?? false,
      image_url: child.image_url ?? null,
      option_values: child.option_values ?? {},
    })),
    parent_sku: hit.parent_sku ?? null,
    parent_url: hit.parent_url ?? null,
    parent_configurable_options: (hit.parent_configurable_options ?? []).map(
      opt => ({
        attribute_id: String(opt.attribute_id ?? ''),
        attribute_code: opt.attribute_code ?? '',
        label: opt.label ?? '',
        values: (opt.values ?? []).map(v => ({
          value_index: String(v.value_index ?? ''),
          label: v.label ?? '',
        })),
      })
    ),
    parent_custom_options: (hit.parent_custom_options ?? []).map(opt => ({
      option_id: opt.option_id ?? 0,
      title: opt.title ?? '',
      type: opt.type ?? '',
      required: opt.required ?? false,
      values: (opt.values ?? []).map(v => ({
        option_type_id: v.option_type_id ?? 0,
        title: v.title ?? '',
        price: v.price ?? 0,
        price_type: v.price_type ?? 'fixed',
        sku: v.sku ?? '',
        sort_order: v.sort_order ?? 0,
      })),
    })),
  };
}

// ─── Cart enrichment: fields to retrieve from Meilisearch ──────────────────────

const CART_ENRICH_FIELDS = [
  'sku',
  'name',
  'thumbnail_url',
  'image_url',
  'thumbnail',
  'url_key',
  'configurable_options',
  'custom_options',
  'parent_sku',
  'parent_url',
  'parent_configurable_options',
  'parent_custom_options',
  'configurable_children',
];

export async function searchCartProductBySkuFromMeilisearch(
  sku: string
): Promise<CartProductEnrichment | null> {
  const host = env.MEILISEARCH_HOST;
  if (!host) throw new Error('MEILISEARCH_HOST is not configured');

  const headers = {
    'Content-Type': 'application/json',
    ...(env.MEILISEARCH_API_KEY
      ? { Authorization: `Bearer ${env.MEILISEARCH_API_KEY}` }
      : {}),
  };

  const baseBody: Record<string, unknown> = {
    q: `"${sku}"`,
    page: 1,
    hitsPerPage: 1,
    attributesToRetrieve: CART_ENRICH_FIELDS,
  };

  const targetSku = sku.trim().toLowerCase();

  try {
    for (const indexUid of getIndexCandidates()) {
      const outcome = await searchIndexWithFacetFallback(
        host,
        indexUid,
        headers,
        baseBody,
        undefined
      );
      if (outcome.kind !== 'ok') continue;

      const hits = (outcome.data.hits as MeilisearchHit[] | undefined) ?? [];
      const exactMatch = hits.find(
        h => (h.sku ?? '').trim().toLowerCase() === targetSku
      );
      if (!exactMatch) continue;

      return hitToCartEnrichment(exactMatch);
    }
    return null;
  } catch (error) {
    await notifyError({
      title: 'Cart Product Enrichment Failed',
      message: JSON.stringify({ sku }),
      error,
    });
    throw error;
  }
}

/**
 * Batch cart enrichment — parallel Meilisearch queries per SKU.
 * Eliminates N browser→server round-trips for multi-item carts.
 */
export async function searchCartProductsBySkusFromMeilisearch(
  skus: string[]
): Promise<Record<string, CartProductEnrichment | null>> {
  if (skus.length === 0) return {};

  const uniqueSkus = [...new Set(skus.map(s => s.trim()).filter(Boolean))];
  const results = await Promise.all(
    uniqueSkus.map(async sku => {
      const enrichment = await searchCartProductBySkuFromMeilisearch(sku);
      return { sku, enrichment };
    })
  );

  const map: Record<string, CartProductEnrichment | null> = {};
  for (const { sku, enrichment } of results) {
    map[sku] = enrichment;
  }
  return map;
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

// ─── Meilisearch hit type extensions ───────────────────────────────────────────
//
// NOTE: configurable_options and configurable_children are available on
// Meilisearch hits from the joydeem_product_en index (added by catalog-sync).
// They are not mapped to ProductCardItem — use direct Meilisearch queries
// or the /api/products?includeOptions=true endpoint to access them.
