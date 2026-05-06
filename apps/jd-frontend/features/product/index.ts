// ――― Core types ―――――――――――――――――――――――――――――――――――――――――――――――――――――
export type {
  ProductCardItem,
  ProductListResult,
  ProductPageCms,
  ProductPageExtras,
  // PDP CMS types
  KeyPoint,
  Guarantee,
  DetailSection,
  Review,
  RecommendedProduct,
  BlogPost,
  ProductVideoCard,
  CrossSellAddon,
  BundleDeal,
  PdpRecipeCard,
  // Magento catalog types
  MagentoProduct,
  MagentoProductImage,
  MagentoMediaGalleryItem,
  MagentoConfigurableOption,
  MagentoGroupedItem,
  MagentoBundleOption,
  MagentoBundleSelection,
  MagentoDownloadableLink,
  MagentoDownloadableSample,
  MagentoCustomAttribute,
  MagentoCustomizableOption,
  MagentoCustomizableOptionValue,
  MagentoLinkedProduct,
  MagentoProductListResponse,
  FetchProductsParams,
} from './bff-types';

export type {
  MagentoCategoryBreadcrumb,
  MagentoCategoryCmsBlock,
  MagentoCategoryDetail,
  MagentoCategoryTree,
} from '@/features/category/types';

// ――― Unified product API ――――――――――――――――――――――――――――――――――――――――――――――
export { fetchUnifiedProduct } from './api/unified.api';
export type { UnifiedLinkedProduct, UnifiedProduct } from './api/unified.api';

// ――― BFF layer ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export { fetchProductPageData } from './api/detail.bff';
export {
  getProductDetailAggregate,
  resolveProductDetailAggregate,
  getProductDetailBFF,
} from './api/detail.bff';
export { getProductListBFF } from './api/list.bff';
export { fetchRelatedProducts } from './api/related.bff';
export { fetchUpsellProducts } from './api/upsell.bff';
export { fetchProductStock } from './api/stock.bff';
export { fetchProductVariants } from './api/variants.bff';
export {
  searchProductsForBFF,
  searchProductsBySkusForBFF,
} from './api/meilisearch.bff';

// ――― Query facade ―――――――――――――――――――――――――――――――――――――――――――――――――――――
export { productQueryFacade } from './api/query-facade';

// ――― API services ―――――――――――――――――――――――――――――――――――――――――――――――――――――
export {
  catalogApi,
  fetchCategoryTree,
  fetchProducts,
} from './api/catalog.api';
export {
  fetchPdpArticlesBySku,
  fetchPdpProductVideosBySku,
  fetchPdpRecipesBySku,
} from './api/content.api';
export {
  fetchReviewsBySku,
  submitReview,
  fetchReviewDimensionSummaryBySku,
  fetchReviewTags,
  type ProductReview,
  type ProductReviewSummary,
  type ProductReviewPagination,
  type ProductReviewDistributionKey,
  type ProductReviewDimensionSummaryItem,
  type ProductReviewMediaGalleryItem,
  type ProductReviewTag,
  type ProductReviewDimensionRating,
  type ProductReviewMedia,
} from './api/reviews.api';
export {
  fetchProductQaBySku,
  submitProductQuestion,
  type ProductQuestion,
} from './api/qa.api';
export {
  searchCartProductBySkuFromMeilisearch,
  searchCartProductsBySkusFromMeilisearch,
} from './api/meilisearch.repo';

// ――― Enrichment types ―――――――――――――――――――――――――――――――――――――――――――――――
export type { ProductSpecificationGroup } from './api/enrichment.api';

// ――― Mappers ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export {
  mapProductListItem,
  mapProductList,
  mapProductDetail,
  mapProductVariants,
} from './services/product.mapper';

// ――― Utilities ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export { normalizeCpPrice } from './services/unified-utils';

// ――― Components ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export { ProductCard } from './components/ProductCard';
export { ProductCardSkeleton } from './components/ProductCardSkeleton';
export { AddToCartButton } from './components/AddToCartButton';
export { QuickAddModal } from './components/QuickAddModal';
export { CustomizableOptionsSection } from './components/CustomizableOptionsSection';
export { ProductCardCompact } from './components/ProductCardSection';
