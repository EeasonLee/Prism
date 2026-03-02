/**
 * Magento/SSO 代理服务统一响应格式
 * /magento/* 接口统一返回 { success, data, error }
 */
export interface MagentoResponse<T> {
  success: boolean;
  data: T;
  error: MagentoErrorBody | null;
}

export interface MagentoErrorBody {
  code: string;
  message: string;
  details: unknown | null;
  request_id: string;
}

// ─── 分类 ───────────────────────────────────────────────────────────────────

export interface MagentoCategoryTree {
  id: number;
  parent_id?: number;
  name: string;
  is_active: boolean;
  position?: number;
  level: number;
  product_count: number;
  children: MagentoCategoryTree[];
}

export interface MagentoCategoryDetail {
  id: number;
  parent_id?: number;
  name: string;
  is_active: boolean;
  position?: number;
  level: number;
  product_count: number;
  children: MagentoCategoryDetail[];
}

// ─── 商品 ───────────────────────────────────────────────────────────────────

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
  media_type: string;
}

export interface MagentoConfigurableOption {
  id: number;
  attribute_id: string;
  label: string;
  position: number;
  product_id: number;
  values: Array<{
    value_index: number;
    label: string;
  }>;
}

export interface MagentoGroupedItem {
  id: number;
  sku: string;
  name: string;
  price: number;
  default_qty: number;
  position: number;
  stock_qty: number;
  is_in_stock: boolean;
  thumbnail_url?: string;
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
  stock_qty: number;
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
  number_of_downloads: number;
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

export interface MagentoProduct {
  id: number;
  sku: string;
  name: string;
  attribute_set_id: number;
  price: number;
  status: number;
  visibility: number;
  type_id:
    | 'simple'
    | 'configurable'
    | 'virtual'
    | 'bundle'
    | 'grouped'
    | 'downloadable';
  created_at: string;
  updated_at: string;
  weight?: number;
  extension_attributes?: {
    category_links?: Array<{ position: number; category_id: string }>;
    configurable_product_options?: MagentoConfigurableOption[];
    configurable_product_links?: number[];
  };
  product_links?: unknown[];
  options?: unknown[];
  media_gallery_entries?: MagentoProductImage[];
  custom_attributes?: MagentoCustomAttribute[];
  // 前端友好字段（由代理服务注入）
  thumbnail_url?: string;
  image_url?: string;
  media_gallery?: MagentoMediaGalleryItem[];
  final_price?: number;
  special_price?: number | null;
  configurable_options?: MagentoConfigurableOption[];
  description?: string;
  url_key?: string;
  stock_qty?: number;
  is_in_stock?: boolean;
  rating?: number;
  rating_percentage?: number;
  review_count?: number;
  has_reviews?: boolean;
  category_ids?: number[];
  // grouped
  grouped_items?: MagentoGroupedItem[];
  // bundle
  bundle_price_type?: 'fixed' | 'dynamic';
  bundle_options?: MagentoBundleOption[];
  // downloadable
  links_purchased_separately?: boolean;
  downloadable_links?: MagentoDownloadableLink[];
  downloadable_samples?: MagentoDownloadableSample[];
  // configurable children
  children?: Array<{
    id: number;
    sku: string;
    name: string;
    price: number;
    stock_qty: number;
    is_in_stock: boolean;
    attributes: Record<string, string>;
    media_gallery?: MagentoMediaGalleryItem[];
  }>;
}

export interface MagentoProductListResponse {
  items: MagentoProduct[];
  search_criteria: {
    filter_groups: unknown[];
    page_size: number;
    current_page: number;
  };
  total_count: number;
}

export interface FetchProductsParams {
  categoryId?: number;
  keyword?: string;
  skus?: string;
  page?: number;
  pageSize?: number;
  storeId?: number;
  sort?: 'entity_id' | 'name' | 'price' | 'created_at' | 'position';
  order?: 'asc' | 'desc';
}

// ─── 购物车 ─────────────────────────────────────────────────────────────────

export interface CartItem {
  item_id: number;
  sku: string;
  qty: number;
  name: string;
  price: number;
  product_type: string;
  quote_id: string;
}

/** /api/cart/items 实际响应结构 */
export interface CartItemsResponse {
  cart_id: string;
  items_count: number;
  items: CartItem[];
  redirect_link?: string;
  link_expires_at?: string;
}

export interface AddCartItemParams {
  sku: string;
  qty: number;
  storeId?: number;
  /** 可配置商品专用，格式：JSON.stringify({ super_attribute: { "93": "56" } }) */
  productOptionsJson?: string;
}

export interface CartRedirectResponse {
  redirect_url: string;
}

// ─── 认证 ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email_verified: boolean;
  active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface GuestAuthResponse {
  guest_id: string;
  tokens: AuthTokens;
}
