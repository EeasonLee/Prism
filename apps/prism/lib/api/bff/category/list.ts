import { getProductListBFF } from '@/lib/api/bff/product/list';
import { categoryService } from '@/lib/services/category.service';
import type {
  CategoryContext,
  CategoryListPageQuery,
  CategoryListPageResult,
  CategoryProductListResult,
  CategoryProductQuery,
  CategoryTreeNode,
} from './types';

const SHOP_ROOT_CATEGORY_ID = 2;

interface CategoryTreeSourceNode {
  id: number;
  name: string;
  url_key?: string | null;
  product_count?: number | null;
  children?: CategoryTreeSourceNode[];
}

function mapCategoryNode(node: CategoryTreeSourceNode): CategoryTreeNode {
  return {
    id: node.id,
    name: node.name,
    slug: node.url_key ?? String(node.id),
    productCount: node.product_count ?? 0,
    isActive: true,
    children: (node.children ?? []).map(mapCategoryNode),
  };
}

function findCategoryBySlug(
  nodes: CategoryTreeNode[],
  slug: string
): CategoryContext | undefined {
  for (const node of nodes) {
    if (node.slug === slug) {
      return { id: node.id, name: node.name, slug: node.slug };
    }
    const found = findCategoryBySlug(node.children, slug);
    if (found) return found;
  }
  return undefined;
}

export async function getCategoryContextBySlug(slug?: string): Promise<{
  categoryTree: CategoryTreeNode[];
  currentCategory?: CategoryContext;
}> {
  const rawTree = await categoryService.getCategoryTree({
    rootId: SHOP_ROOT_CATEGORY_ID,
  });
  const categoryTree = (rawTree.children ?? []).map(mapCategoryNode);

  const currentCategory = slug
    ? findCategoryBySlug(categoryTree, slug)
    : undefined;

  if (slug && !currentCategory) {
    throw new Error(`Category not found for slug: ${slug}`);
  }

  return {
    categoryTree,
    currentCategory,
  };
}

export async function getCategoryProductList(
  query: CategoryProductQuery
): Promise<CategoryProductListResult> {
  return getProductListBFF({
    categoryId: query.categoryId,
    categoryName: query.categoryName,
    categorySlug: query.slug,
    page: query.page ?? 1,
    limit: query.pageSize ?? 24,
  });
}

export async function getCategoryListPageData(
  query: CategoryListPageQuery
): Promise<CategoryListPageResult> {
  const { categoryTree, currentCategory } = await getCategoryContextBySlug(
    query.slug
  );

  const productList = await getCategoryProductList({
    categoryId: currentCategory?.id,
    page: query.page,
    pageSize: query.pageSize,
  });

  return {
    products: productList.items,
    pagination: productList.pagination,
    categoryTree,
    currentCategory,
  };
}
