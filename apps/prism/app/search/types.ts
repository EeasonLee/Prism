/**
 * Search / Category 商品检索体系类型定义
 *
 * 对应 Strapi Content Types:
 * - discovery-category
 * - discovery-category-mapping
 * - discovery-filter-config
 */

// ――― SEO ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export interface SearchSeo {
  title?: string;
  description?: string;
}

// ――― 前台分类 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export type SearchSortOption =
  | 'featured'
  | 'price_asc'
  | 'price_desc'
  | 'newest';
export type SearchLayoutType = 'grid' | 'list';

export interface SearchCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  /** 层级：1 = 一级，2 = 二级，3 = 三级 */
  level: 1 | 2 | 3;
  sort_order: number;
  is_visible: boolean;
  default_sort: SearchSortOption;
  layout_type: SearchLayoutType;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  seo?: SearchSeo;
  /** 子分类（populate 时返回） */
  children?: SearchCategory[];
}

// ――― 分类映射 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export interface SearchCategoryMapping {
  id: number;
  documentId: string;
  discovery_category_id: number;
  /** 对应的 Magento 分类 ID 数组，如 [37, 42, 55] */
  magento_category_ids: number[];
  is_active: boolean;
}

// ――― 筛选配置 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export interface SearchPriceRange {
  label: string;
  min?: number;
  max?: number;
}

export interface SearchFilterConfig {
  id: number;
  documentId: string;
  discovery_category_id: number;
  /** 启用的筛选项，如 ["brand", "price"] */
  enabled_filters: string[];
  /** 可用排序选项，如 ["featured", "price_asc", "price_desc", "newest"] */
  sort_options: SearchSortOption[];
  default_sort: SearchSortOption;
  /** 价格区间预设，如 [{ label: "Under $50", max: 50 }] */
  price_ranges: SearchPriceRange[];
  is_enabled: boolean;
}

// ――― 商品卡片 ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export interface ProductCardItem {
  sku: string;
  name: string;
  subtitle?: string;
  thumbnail?: string;
  price: number | null;
  /** 价格区间（可配置商品） */
  price_range?: { min: number; max: number };
  currency?: string;
  in_stock: boolean;
  promotion_label?: string;
  /** 商品详情页链接 */
  href: string;
}

// ――― 查询契约 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export interface ProductSearchQuery {
  /** 前台分类 slug（分类页传入，搜索页不传） */
  slug?: string;
  /** 搜索关键词（搜索页传入，分类页不传） */
  q?: string;
  brand?: string;
  size?: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  sort?: SearchSortOption;
  page?: number;
  pageSize?: number;
}

// ――― 结果契约 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export interface SearchAppliedFilter {
  key: string;
  value: string | number;
  label: string;
}

export interface SearchAvailableFilter {
  key: string;
  label: string;
  type: 'checkbox' | 'range' | 'select';
  options?: Array<{ value: string; label: string; count?: number }>;
}

export interface SearchPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProductSearchResult {
  /** 分类页时返回，搜索页为 undefined */
  category?: SearchCategory;
  applied_filters: SearchAppliedFilter[];
  available_filters: SearchAvailableFilter[];
  sort_options: SearchSortOption[];
  items: ProductCardItem[];
  pagination: SearchPagination;
  total: number;
}
