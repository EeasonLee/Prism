export { fetchProductSearchResult } from './api/search-service';
export {
  searchProducts as searchProductsFromMeilisearch,
  type MeilisearchSearchResult,
} from './api/search-meilisearch';
export {
  fetchRelatedBySlug,
  type RelatedProductItem,
} from './api/meilisearch.service';
export { searchProducts, type ShopSortOption } from './api/shop-search';
export { GlobalSearch } from './components/GlobalSearch';
export { FilterPanel } from './components/FilterPanel';
export { SortPanel } from './components/SortPanel';
export type {
  SearchSeo,
  SearchSortOption,
  SearchLayoutType,
  SearchCategory,
  SearchPriceRange,
  SearchProductCardItem,
  ProductSearchQuery,
  SearchAppliedFilter,
  SearchAvailableFilter,
  SearchPagination,
  ProductSearchResult,
} from './types';
