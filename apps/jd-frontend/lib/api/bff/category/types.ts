import type { ProductListResult } from '@/lib/api/bff/product/types';

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
