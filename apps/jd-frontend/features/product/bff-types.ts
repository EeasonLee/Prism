export interface ProductCardItem {
  sku: string;
  name: string;
  displayName: string;
  shortName?: string | null;
  longTitle?: string | null;
  shortDescription?: string | null;
  urlKey: string | null;
  image: string | null;
  price: {
    value: number | null;
    currency: string | null;
  };
  originalPrice: number | null;
  inStock: boolean;
  type: string | null;
  promotionLabel: string | null;
  /** Magento 促销文案（Meilisearch cp_label），与 cpLabelColor 搭配展示 */
  cpLabel: string | null;
  /** 标签背景色：通常为 #RRGGBB（Meilisearch cp_label_color） */
  cpLabelColor: string | null;
  reviewCount: number;
  ratingPercentage: number;
  createdAt?: number;
  /**
   * 可配置商品变体与选项数据（来自 catalog-sync-service Redis 缓存）。
   * 当缓存未命中时为 undefined，前端可以继续通过单独接口获取。
   */
  variantData?: {
    options: Array<{
      attribute_id: number;
      code: string;
      label: string;
      values: Array<{ label: string; value: string }>;
    }>;
    customizable_options: Array<{
      option_id: number;
      title: string;
      required: boolean;
      type: string;
      values?: Array<{ option_type_id: number; title: string; price: number }>;
    }>;
    variants: Array<{
      sku: string;
      attributes: Record<string, string>;
      inStock: boolean;
      price: number;
    }>;
  };
}

export interface ProductListResult {
  items: ProductCardItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ――― PDP CMS 区块类型（从 app/products/[slug]/product-page-types.ts 迁移）――――――――――――

export interface KeyPoint {
  icon: string;
  title: string;
  description: string;
}

export interface Guarantee {
  icon: string;
  title: string;
  description: string;
}

export interface DetailSection {
  image: string;
  imageAlt: string;
  title: string;
  body: string;
  reversed: boolean;
}

export interface Review {
  id: number;
  author: string;
  avatarInitials: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
}

export interface RecommendedProduct {
  id: number;
  sku: string;
  name: string;
  price: number;
  special_price?: number;
  currency?: string;
  image: string;
  badge?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  image: string;
  date: string;
  excerpt: string;
  href: string;
  readTime: string;
}

export interface ProductVideoCard {
  id: number;
  title: string;
  caption: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface CrossSellAddon {
  id: number;
  sku: string;
  name: string;
  description: string;
  image: string;
  original_price: number;
  addon_price: number;
}

export interface BundleDeal {
  id: number;
  title: string;
  description: string;
  partner_products: Array<{
    sku: string;
    name: string;
    image: string;
    price: number;
  }>;
  bundle_price: number;
  original_total: number;
  savings: number;
}

export interface ProductPageExtras {
  promotion_countdown_to: string;
  key_points: KeyPoint[];
  guarantees: Guarantee[];
  detail_sections: DetailSection[];
  reviews: Review[];
  review_summary: {
    average: number;
    total: number;
    distribution: Record<5 | 4 | 3 | 2 | 1, number>;
  };
  recommended_products: RecommendedProduct[];
  recipes: PdpRecipeCard[];
  blog_posts: BlogPost[];
  product_videos: ProductVideoCard[];
  cross_sell_addons: CrossSellAddon[];
  bundle_deals: BundleDeal[];
}

/** PDP 显示用菜谱卡片（区别于 features/recipe/types.ts 中的完整 Recipe 类型） */
export interface PdpRecipeCard {
  id: number;
  title: string;
  description: string;
  image: string;
  href?: string;
  time: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

export type ProductPageCms = ProductPageExtras;

// ――― Magento 商品/分类原始类型（从 lib/api/magento/types.ts 迁移）――――――――――――

export interface MagentoProductImage {
  id: number;
  media_type: string;
  label: string | null;
  position: number;
  disabled: boolean;
  types: string[];
  file: string;
  url: string;
}

export interface MagentoMediaGalleryItem {
  url: string;
  label: string | null;
  position: number;
  media_type: string | null;
}

export interface MagentoConfigurableOption {
  id: number;
  attribute_id: string;
  label: string;
  attribute_code?: string | null;
  position?: number | null;
  product_id?: number | null;
  values: Array<{ value_index: number; label: string }>;
}

export interface MagentoGroupedItem {
  id: number;
  sku: string;
  name: string;
  price: number;
  special_price?: number | null;
  default_qty?: number | null;
  position?: number | null;
  stock_qty?: number | null;
  stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
  is_in_stock: boolean;
  thumbnail_url?: string | null;
}

export interface MagentoBundleSelection {
  selection_id: number;
  sku: string;
  name: string;
  price: number;
  price_type: 'fixed' | 'percent';
  default_qty: number;
  is_default: boolean;
  can_change_qty: boolean;
  stock_qty?: number | null;
  stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
  is_in_stock: boolean;
}

export interface MagentoBundleOption {
  option_id: number;
  title: string;
  required: boolean;
  type: 'select' | 'radio' | 'checkbox' | 'multi';
  position: number;
  selections: MagentoBundleSelection[];
}

export interface MagentoDownloadableLink {
  link_id: number;
  title: string;
  price: number;
  sort_order: number;
  number_of_downloads?: number | null;
  sample_url?: string | null;
}

export interface MagentoDownloadableSample {
  sample_id: number;
  title: string;
  sort_order: number;
  sample_url: string;
}

export interface MagentoCustomAttribute {
  attribute_code: string;
  value: string | string[];
}

export type CustomizableOptionType =
  | 'drop_down'
  | 'radio'
  | 'checkbox'
  | 'multiple'
  | 'field'
  | 'area'
  | 'date'
  | 'date_time'
  | 'time'
  | 'file';

export interface MagentoCustomizableOptionValue {
  option_type_id: number;
  title: string;
  price: number;
  price_type: 'fixed' | 'percent' | 'dynamic';
  sort_order: number;
}

export interface MagentoCustomizableOption {
  option_id: number;
  title: string;
  required: boolean;
  sort_order: number;
  type: CustomizableOptionType;
  values?: MagentoCustomizableOptionValue[];
  max_characters?: number | null;
}

export interface MagentoLinkedProduct {
  id: number;
  sku: string;
  name: string;
  url_key?: string | null;
  display_name: string;
  price: number;
  special_price?: number | null;
  type_id: string;
  is_in_stock: boolean;
  review_count?: number | null;
  rating_percentage?: number | null;
  promotion_label?: string | null;
  unified_thumbnail?: string | null;
}

export interface MagentoProduct {
  id: number;
  __typename?: string | null;
  uid?: string | null;
  sku: string;
  name: string;
  price: number;
  currency?: string | null;
  attribute_set_id?: number;
  status?: number | null;
  visibility?: number | null;
  type_id:
    | 'simple'
    | 'configurable'
    | 'virtual'
    | 'bundle'
    | 'grouped'
    | 'downloadable';
  created_at?: string;
  updated_at?: string;
  weight?: number | null;
  extension_attributes?: {
    category_links?: Array<{ position: number; category_id: string }>;
    configurable_product_options?: MagentoConfigurableOption[];
    configurable_product_links?: number[];
  };
  product_links?: unknown[];
  options?: MagentoCustomizableOption[];
  media_gallery_entries?: MagentoProductImage[];
  custom_attributes?: MagentoCustomAttribute[];
  long_title?: string | null;
  cp_label?: string | null;
  cp_code?: string | null;
  cp_date?: string | null;
  cp_price?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  specifications?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  media_gallery?: MagentoMediaGalleryItem[];
  final_price?: number;
  special_price?: number | null;
  configurable_options?: MagentoConfigurableOption[];
  description?: string | null;
  short_description?: string | null;
  extra_attributes?: Record<string, unknown> | null;
  url_key?: string | null;
  stock_qty?: number | null;
  stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
  is_in_stock?: boolean;
  rating?: number | null;
  rating_percentage?: number | null;
  review_count?: number | null;
  has_reviews?: boolean;
  category_ids?: number[];
  categories?: Array<{ id: number; name: string; level: number }>;
  related_products?: MagentoLinkedProduct[];
  upsell_products?: MagentoLinkedProduct[];
  grouped_items?: MagentoGroupedItem[];
  bundle_price_type?: 'fixed' | 'dynamic';
  bundle_options?: MagentoBundleOption[];
  links_purchased_separately?: boolean;
  downloadable_links?: MagentoDownloadableLink[];
  downloadable_samples?: MagentoDownloadableSample[];
  children?: Array<{
    id: number;
    uid?: string | null;
    sku: string;
    name: string;
    price: number;
    special_price?: number | null;
    stock_qty?: number | null;
    stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
    is_in_stock: boolean;
    attributes: Record<string, string>;
    media_gallery?: MagentoMediaGalleryItem[];
    cp_label?: string | null;
    cp_code?: string | null;
    cp_date?: string | null;
    cp_price?: number | null;
  }>;
}

export interface MagentoProductListResponse {
  items: MagentoProduct[];
  page_info: { current_page: number; page_size: number; total_pages: number };
  total_count: number;
}

export interface FetchProductsParams {
  categoryId?: number;
  keyword?: string;
  skus?: string;
  page?: number;
  pageSize?: number;
  storeCode?: string;
  sort?: 'entity_id' | 'name' | 'price' | 'created_at' | 'position';
  order?: 'asc' | 'desc';
}

export interface MagentoCategoryBreadcrumb {
  category_id: number;
  category_name: string;
  category_level: number;
}

export interface MagentoCategoryCmsBlock {
  identifier: string;
  title: string;
  content: string;
}

export interface MagentoCategoryDetail {
  id: number;
  uid?: string | null;
  parent_id?: number | null;
  name: string;
  is_active: boolean;
  position?: number | null;
  level: number;
  product_count: number;
  url_path?: string | null;
  url_key?: string | null;
  description?: string | null;
  image_url?: string | null;
  path?: string | null;
  breadcrumbs?: MagentoCategoryBreadcrumb[] | null;
  children_ids?: number[] | null;
  cms_block?: MagentoCategoryCmsBlock | null;
}

export interface MagentoCategoryTree {
  id: number;
  uid?: string | null;
  parent_id?: number | null;
  name: string;
  is_active: boolean;
  position?: number | null;
  level: number;
  product_count: number;
  url_path?: string | null;
  url_key?: string | null;
  children: MagentoCategoryTree[];
}
