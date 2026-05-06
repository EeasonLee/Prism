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
export { fetchUnifiedProduct } from './unified.api';

// ――― BFF layer ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export { fetchProductPageData } from './detail.bff';
export { fetchProductList } from './list.bff';
export { fetchRelatedProducts } from './related.bff';
export { fetchUpsellProducts } from './upsell.bff';
export { fetchProductStock } from './stock.bff';
export { fetchProductVariants } from './variants.bff';

// ――― API services ―――――――――――――――――――――――――――――――――――――――――――――――――――――
export { catalogApi } from './catalog.api';
export {
  fetchPdpArticlesBySku,
  fetchPdpProductVideosBySku,
  fetchPdpRecipesBySku,
} from './content.api';
export { fetchReviewsBySku, submitReview } from './reviews.api';
export { fetchProductQaBySku, submitProductQuestion } from './qa.api';

// ――― Mappers ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export {
  mapProductListItem,
  mapProductList,
  mapProductDetail,
  mapProductVariants,
} from './product.mapper';

// ――― Components ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export { ProductCard } from './ProductCard';
export { ProductCardSkeleton } from './ProductCardSkeleton';
export { AddToCartButton } from './AddToCartButton';
export { QuickAddModal } from './QuickAddModal';
export { CustomizableOptionsSection } from './CustomizableOptionsSection';
