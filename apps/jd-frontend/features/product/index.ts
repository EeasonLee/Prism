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
  MagentoCategoryBreadcrumb,
  MagentoCategoryCmsBlock,
  MagentoCategoryDetail,
  MagentoCategoryTree,
  FetchProductsParams,
} from './bff-types';

// ――― Unified product API ――――――――――――――――――――――――――――――――――――――――――――――
export { fetchUnifiedProduct } from './unified.api';
export { buildProductDetailView } from './unified-utils';

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
export { fetchReviews, submitReview } from './reviews.api';
export { fetchProductQA, submitProductQuestion } from './qa.api';

// ――― Mappers ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export { mapMagentoProductToCard } from './product.mapper';

// ――― Components ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
export { ProductCard } from './ProductCard';
export { ProductCardSkeleton } from './ProductCardSkeleton';
export { AddToCartButton } from './AddToCartButton';
export { QuickAddModal } from './QuickAddModal';
export { CustomizableOptionsSection } from './CustomizableOptionsSection';
