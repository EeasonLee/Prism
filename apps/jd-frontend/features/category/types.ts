import type { ProductListResult } from '@/features/product/bff-types';

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
