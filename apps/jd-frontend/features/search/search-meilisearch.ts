import { productQueryFacade } from '@/features/product/query-facade';
import type {
  SearchSortOption,
  SearchProductCardItem,
  SearchPagination,
} from './types';

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
  /** Opt-in: listing/search UIs omit facets by default to avoid Meili facet misconfiguration. */
  includeFacets?: boolean;
}

export interface MeilisearchSearchResult {
  items: SearchProductCardItem[];
  pagination: SearchPagination;
  facetDistribution?: Record<string, Record<string, number>>;
}
function toSearchCardItem(
  item: Awaited<
    ReturnType<typeof productQueryFacade.queryProducts>
  >['items'][number]
): SearchProductCardItem {
  return {
    sku: item.sku,
    name: item.displayName || item.name,
    thumbnail: item.image ?? undefined,
    price: item.price.value,
    in_stock: item.inStock,
    promotion_label: item.promotionLabel ?? undefined,
    href: `/products/${encodeURIComponent(item.urlKey ?? item.sku)}`,
  };
}

export async function searchProducts(
  params: MeilisearchSearchParams
): Promise<MeilisearchSearchResult> {
  const result = await productQueryFacade.queryProducts({
    q: params.q,
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    includeFacets: params.includeFacets === true,
    filters: {
      category: params.category,
      brand: params.brand,
      size: params.size,
      priceMin: params.priceMin,
      priceMax: params.priceMax,
    },
  });

  return {
    items: result.items.map(toSearchCardItem),
    pagination: result.pagination,
    facetDistribution: Object.fromEntries(
      result.availableFilters.map(filter => [
        filter.key,
        Object.fromEntries(
          filter.options.map(option => [option.value, option.count ?? 0])
        ),
      ])
    ),
  };
}
