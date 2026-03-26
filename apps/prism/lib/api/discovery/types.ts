/**
 * 商品发现体系类型定义
 *
 * 对应 Strapi Content Types:
 * - discovery-category
 * - discovery-category-mapping
 * - discovery-filter-config
 */

// ─── SEO ──────────────────────────────────────────────────────────────────────

export interface DiscoverySeo {
  title?: string;
  description?: string;
}

// ─── 前台分类 ─────────────────────────────────────────────────────────────────

export type DiscoverySortOption =
  | 'featured'
  | 'price_asc'
  | 'price_desc'
  | 'newest';
export type DiscoveryLayoutType = 'grid' | 'list';

export interface DiscoveryCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  /** 层级：1 = 一级，2 = 二级，3 = 三级 */
  level: 1 | 2 | 3;
  sort_order: number;
  is_visible: boolean;
  default_sort: DiscoverySortOption;
  layout_type: DiscoveryLayoutType;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  seo?: DiscoverySeo;
  /** 子分类（populate 时返回） */
  children?: DiscoveryCategory[];
}

// ─── 分类映射 ─────────────────────────────────────────────────────────────────

export interface DiscoveryCategoryMapping {
  id: number;
  documentId: string;
  discovery_category_id: number;
  /** 对应的 Magento 分类 ID 数组，如 [37, 42, 55] */
  magento_category_ids: number[];
  is_active: boolean;
}

// ─── 筛选配置 ─────────────────────────────────────────────────────────────────

export interface DiscoveryPriceRange {
  label: string;
  min?: number;
  max?: number;
}

export interface DiscoveryFilterConfig {
  id: number;
  documentId: string;
  discovery_category_id: number;
  /** 启用的筛选项，如 ["brand", "price"] */
  enabled_filters: string[];
  /** 可用排序选项，如 ["featured", "price_asc", "price_desc", "newest"] */
  sort_options: DiscoverySortOption[];
  default_sort: DiscoverySortOption;
  /** 价格区间预设，如 [{ label: "Under $50", max: 50 }] */
  price_ranges: DiscoveryPriceRange[];
  is_enabled: boolean;
}

// ─── 商品卡片 ─────────────────────────────────────────────────────────────────

export interface ProductCardItem {
  sku: string;
  name: string;
  subtitle?: string;
  thumbnail?: string;
  price: number;
  /** 价格区间（可配置商品） */
  price_range?: { min: number; max: number };
  currency?: string;
  in_stock: boolean;
  promotion_label?: string;
  /** 商品详情页链接 */
  href: string;
}

// ─── 查询契约 ─────────────────────────────────────────────────────────────────

export interface ProductDiscoveryQuery {
  /** 前台分类 slug（分类页传入，搜索页不传） */
  slug?: string;
  /** 搜索关键词（搜索页传入，分类页不传） */
  q?: string;
  brand?: string;
  price_min?: number;
  price_max?: number;
  sort?: DiscoverySortOption;
  page?: number;
  pageSize?: number;
}

// ─── 结果契约 ─────────────────────────────────────────────────────────────────

export interface DiscoveryAppliedFilter {
  key: string;
  value: string | number;
  label: string;
}

export interface DiscoveryAvailableFilter {
  key: string;
  label: string;
  type: 'checkbox' | 'range' | 'select';
  options?: Array<{ value: string; label: string; count?: number }>;
}

export interface DiscoveryPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProductDiscoveryResult {
  /** 分类页时返回，搜索页为 undefined */
  category?: DiscoveryCategory;
  applied_filters: DiscoveryAppliedFilter[];
  available_filters: DiscoveryAvailableFilter[];
  sort_options: DiscoverySortOption[];
  items: ProductCardItem[];
  pagination: DiscoveryPagination;
  total: number;
}
