import { productQueryFacade } from '@/features/product';
import { categoryService } from './category.service';
import type {
  CategoryContext,
  CategoryListPageQuery,
  CategoryListPageResult,
  CategoryProductListResult,
  CategoryProductQuery,
  CategoryTreeNode,
} from '../types';

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

/**
 * 轻量分类解析：只返回分类基础信息（id / name / slug），不返回完整树。
 * 内部复用 getCategoryContextBySlug，未来可替换为 Redis/缓存查询。
 */
export async function resolveCategoryBySlug(
  slug: string
): Promise<CategoryContext | null> {
  try {
    const strapiCategory = await categoryService.getStrapiCategoryBasicBySlug(
      slug
    );
    if (strapiCategory) {
      return strapiCategory;
    }
  } catch (error) {
    console.warn(
      'resolveCategoryBySlug: Strapi lookup failed, fallback to Magento',
      {
        slug,
        error,
      }
    );
  }

  try {
    const result = await getCategoryContextBySlug(slug);
    if (result.currentCategory) {
      return result.currentCategory;
    }
  } catch {
    /* 浅层树未包含该 slug（例如第三层以下），继续按 url_key 查询 */
  }

  try {
    const row = await categoryService.getCategoryByUrlKey(slug);
    if (!row) {
      return null;
    }
    return { id: row.id, name: row.name, slug: row.url_key };
  } catch {
    return null;
  }
}

export async function getCategoryProductList(
  query: CategoryProductQuery
): Promise<CategoryProductListResult> {
  return productQueryFacade.queryProducts({
    magentoCategoryId: query.categoryId,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 24,
    filters: query.categoryName ? { category: query.categoryName } : undefined,
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
