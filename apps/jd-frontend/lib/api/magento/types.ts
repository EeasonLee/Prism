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
  media_type: string | null;
}

export interface MagentoConfigurableOption {
  id: number;
  attribute_id: string;
  label: string;
  attribute_code?: string | null;
  position?: number | null;
  product_id?: number | null;
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
  // Magento 自定义属性
  long_title?: string | null;
  cp_label?: string | null;
  cp_code?: string | null;
  cp_date?: string | null;
  /** 与 cp_code 对应的可抵扣金额 */
  cp_price?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  specifications?: string | null;
  // 前端友好字段（由代理服务注入）
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
  categories?: Array<{
    id: number;
    name: string;
    level: number;
  }>;
  related_products?: MagentoLinkedProduct[];
  upsell_products?: MagentoLinkedProduct[];
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
  page_info: {
    current_page: number;
    page_size: number;
    total_pages: number;
  };
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

// ─── 购物车 ─────────────────────────────────────────────────────────────────

/** 与 Magento GraphQL Money 一致 */
export interface CartMoney {
  value: number;
  currency: string;
}

/** 购物车级别价格汇总（来自 cart.prices） */
export interface CartTotals {
  grand_total: CartMoney | null;
  grand_total_excluding_tax: CartMoney | null;
  subtotal_excluding_tax: CartMoney | null;
  subtotal_including_tax: CartMoney | null;
  discount: CartMoney | null;
  /** 例如 coupon code: SAVE20 */
  coupon_code?: string | null;
  /** 例如 Discount / Discount (SAVE20) 的标题来源 */
  discount_reason?: string | null;
}

/** 行上可展示的选项（可配置 / 自定义等） */
export interface CartLineOption {
  label: string;
  value: string;
}

export interface CartItem {
  /** Magento GraphQL cart line item uid (opaque string, not numeric REST id) */
  item_id: string;
  sku: string;
  qty: number;
  name: string;
  price: number;
  product_type: string;
  quote_id?: string;
  /** 可配置选项、自定义选项等 */
  options?: CartLineOption[];
  /** 行小计（单价×数量，以商店计税规则为准） */
  row_total?: number;
  row_total_including_tax?: number;
  /** 与 price / row_total 对应的货币代码 */
  currency?: string;
  thumbnail?: string | null;
}

/** /api/cart/items 实际响应结构 */
export interface CartItemsResponse {
  cart_id: string;
  /** 购物车行数 */
  items_count: number;
  /** 商品总件数（与 Magento total_quantity 一致） */
  total_quantity: number;
  items: CartItem[];
  /** 购物车合计；无报价或未返回时为 null */
  totals: CartTotals | null;
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
  /** 购物车合并状态：success / failed / skipped */
  cartMergeStatus?: 'success' | 'failed' | 'skipped';
}

export interface GuestAuthResponse {
  guest_id: string;
  tokens: AuthTokens;
}
