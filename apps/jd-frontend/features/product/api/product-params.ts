/**
 * URL query param parser for the unified /api/products endpoint.
 *
 * Maps raw URLSearchParams → UnifiedProductQuery consumed by ProductQueryFacade.
 */
import type {
  UnifiedProductQuery,
  UnifiedProductSortOption,
} from '../services/query.model';

function safePositiveInt(raw: string | null): number | undefined {
  if (raw === null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function safeFloat(raw: string | null): number | undefined {
  if (raw === null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

const VALID_SORT = new Set<string>([
  'featured',
  'price_asc',
  'price_desc',
  'newest',
  'name',
]);

function parseSort(raw: string | null): UnifiedProductSortOption | undefined {
  if (!raw?.trim()) return undefined;
  const v = raw.trim();
  return VALID_SORT.has(v) ? (v as UnifiedProductSortOption) : undefined;
}

function parseSkus(raw: string | null): string[] | undefined {
  if (!raw?.trim()) return undefined;
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function parseProductQueryParams(
  sp: URLSearchParams
): UnifiedProductQuery {
  const q = sp.get('q')?.trim() || undefined;
  const sku = sp.get('sku')?.trim() || undefined;
  const rawSkus = sp.get('skus')?.trim();
  const skus = rawSkus ? parseSkus(rawSkus) : undefined;
  const magentoCategoryId = safePositiveInt(sp.get('magentoCategoryId'));
  const strapiCategoryId = safePositiveInt(sp.get('strapiCategoryId'));
  const strapiCategorySlug = sp.get('strapiCategorySlug')?.trim() || undefined;
  const page = safePositiveInt(sp.get('page'));
  const pageSize = safePositiveInt(sp.get('pageSize'));
  const sort = parseSort(sp.get('sort'));

  const brand = sp.get('brand')?.trim() || undefined;
  const size = sp.get('size')?.trim() || undefined;
  const stockStatus = sp.get('stock_status')?.trim() || undefined;
  const category = sp.get('category')?.trim() || undefined;
  const priceMin = safeFloat(sp.get('price_min'));
  const priceMax = safeFloat(sp.get('price_max'));

  const hasFilters =
    brand ||
    size ||
    stockStatus ||
    category ||
    priceMin !== undefined ||
    priceMax !== undefined;

  // When skus are requested, also need to handle via single SKU
  if (sku || (skus && skus.length === 1)) {
    return {
      sku: sku ?? skus?.[0],
      page: 1,
      pageSize: 1,
    };
  }

  return {
    q,
    magentoCategoryId,
    strapiCategoryId,
    strapiCategorySlug,
    page,
    pageSize,
    sort,
    filters: hasFilters
      ? {
          brand,
          size,
          stockStatus,
          category,
          priceMin,
          priceMax,
        }
      : undefined,
  };
}
