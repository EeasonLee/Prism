import type { ProductListResult } from '@/features/product/bff-types';

// ――― Magento 分类原始类型（从 product/bff-types.ts 迁移）――――――――――――

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

// ――― 应用层分类类型 ―――――――――――――――――――――――――――――――――――――――――――――――

export interface CategoryTreeNode {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  isActive: boolean;
  children: CategoryTreeNode[];
}

export interface CategoryContext {
  id: number;
  name: string;
  slug: string;
  content?: string | null;
  backgroundImageUrl?: string | null;
  magentoCategoryId?: number | null;
  children?: Array<{
    id: number;
    name: string;
    slug: string;
    imageUrl?: string | null;
  }>;
}

export interface CategoryProductQuery {
  slug?: string;
  categoryId?: number;
  categoryName?: string;
  page?: number;
  pageSize?: number;
}

export type CategoryProductListResult = ProductListResult;

export type CategoryListPageQuery = CategoryProductQuery;

export interface CategoryListPageResult {
  products: CategoryProductListResult['items'];
  pagination: CategoryProductListResult['pagination'];
  categoryTree: CategoryTreeNode[];
  currentCategory?: CategoryContext;
}
