import type { ProductCardItem } from '../bff-types';

export type UnifiedProductSortOption =
  | 'featured'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'name';

export interface UnifiedProductFilters {
  brand?: string;
  size?: string;
  stockStatus?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
}

export interface UnifiedProductPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UnifiedProductQuery {
  q?: string;
  sku?: string;
  magentoCategoryId?: number;
  strapiCategoryId?: number;
  strapiCategorySlug?: string;
  /**
   * When false, Meilisearch requests omit `facets` so index misconfiguration
   * (non-facetable fields) cannot break listing/search.
   */
  includeFacets?: boolean;
  page?: number;
  pageSize?: number;
  sort?: UnifiedProductSortOption;
  filters?: UnifiedProductFilters;
}

export interface UnifiedAvailableFilter {
  key: string;
  label: string;
  options: Array<{ value: string; label: string; count?: number }>;
}

export interface UnifiedProductQueryResult {
  items: ProductCardItem[];
  pagination: UnifiedProductPagination;
  availableFilters: UnifiedAvailableFilter[];
  resolvedMagentoCategoryId?: number;
}
