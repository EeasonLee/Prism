/**
 * Search / Category 商品检索体系类型定义
 */

// ――― SEO ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export interface SearchSeo {
  title?: string;
  description?: string;
}

// ――― 前台分类 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export type SearchSortOption =
  | 'featured'
  | 'price_asc'
  | 'price_desc'
  | 'newest';
export type SearchLayoutType = 'grid' | 'list';

export interface SearchCategory {
  id: number;
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

// ――― 筛选配置 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

export interface SearchPriceRange {
  label: string;
  min?: number;
  max?: number;
}

// ――― 商品卡片 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

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

// ――― 查询契约 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

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

// ――― 结果契约 ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

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
  applied_filters: SearchAppliedFilter[];
  available_filters: SearchAvailableFilter[];
  sort_options: SearchSortOption[];
  items: ProductCardItem[];
  pagination: SearchPagination;
  total: number;
}
