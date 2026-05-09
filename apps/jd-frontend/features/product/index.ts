// ――― Unified display types ――――――――――――――――――――――――――――――――――――――――――――――
export type {
  UnifiedProductDisplay,
  VariantData,
  VariantOption,
  VariantOptionValue,
  ProductVariant,
  CustomizableOption,
  CustomizableOptionValue,
} from './types';

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
export {
  fetchUnifiedProductBySku,
  fetchUnifiedProductBySlug,
  fetchUnifiedProducts,
  mapGQLProduct,
  mapLinkedProduct,
  mergeProduct,
} from './api/unified.api';
export type { UnifiedLinkedProduct, UnifiedProduct } from './api/unified.api';

// ――― BFF layer ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export {
  getProductDetailAggregate,
  resolveProductDetailAggregate,
  getProductDetailBFF,
} from './api/detail.bff';
export { getRelatedProductsBFF } from './api/related.bff';
export { getUpsellProductsBFF } from './api/upsell.bff';
export { getProductStockBFF } from './api/stock.bff';
export { getProductVariantsBFF } from './api/variants.bff';

// ――― Query facade ―――――――――――――――――――――――――――――――――――――――――――――――――――――
export { productQueryFacade } from './api/query-facade';
export { parseProductQueryParams } from './api/product-params';
export type {
  UnifiedProductQueryResult,
  UnifiedProductSortOption,
} from './services/query.model';

// ――― API services ―――――――――――――――――――――――――――――――――――――――――――――――――――――
export {
  fetchCategoryTree,
  fetchCategoryById,
  fetchProducts,
  fetchProductBySku,
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
  fetchReviewMediaBySku,
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

// ――― Display mapper ―――――――――――――――――――――――――――――――――――――――――――――――――――
export {
  computeDiscountPercent,
  mapCardItemToDisplay,
  mapUnifiedToDisplay,
  mapMagentoProductToDisplay,
} from './services/display-mapper';

// ――― Utilities ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export { normalizeCpPrice } from './services/unified-utils';
export { stripHtml } from './services/html-utils';

// ――― Navigation ―――――――――――――――――――――――――――――――――――――――――――――――――――――――
export {
  buildProductUrl,
  shouldOpenInNewTab,
} from './services/product-navigation';
export type { ProductNavigationOptions } from './services/product-navigation';

// ――― Components ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export { ProductCard } from './components/ProductCard';
export { ProductCardSkeleton } from './components/ProductCardSkeleton';
export { AddToCartButton } from './components/AddToCartButton';
export { QuickAddModal } from './components/QuickAddModal';
export { CustomizableOptionsSection } from './components/CustomizableOptionsSection';
export { ProductLabel } from './components/ProductLabel';
export { ProductPrice } from './components/ProductPrice';
export { CouponBanner } from './components/CouponBanner';
export type { ProductCardVariant } from './components/ProductCard';
