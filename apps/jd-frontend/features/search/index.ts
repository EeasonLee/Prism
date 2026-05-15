export {
  fetchRelatedBySlug,
  type RelatedProductItem,
} from './api/meilisearch.service';
export { GlobalSearch } from './components/GlobalSearch';
export { FilterPanel } from './components/FilterPanel';
export { SortPanel, type ShopSortOption } from './components/SortPanel';
export {
  SearchProductLink,
  type SearchProductLinkProduct,
} from './components/SearchProductLink';
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
