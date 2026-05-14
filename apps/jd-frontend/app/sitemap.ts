import {
  fetchAllCmsPagesForSitemap,
  type CmsPageSitemapRow,
} from '@/features/cms-page/api/cms-pages.api';
import {
  fetchArticleCategories,
  searchArticles,
  type ArticleDetail,
  type CategoryDetail,
} from '@/features/blog/api';
import {
  getCategoryContextBySlug,
  type CategoryTreeNode,
} from '@/features/category';
import { productQueryFacade, type ProductCardItem } from '@/features/product';
import { absoluteUrl } from '@/shared/utils/seo';
import type { MetadataRoute } from 'next';
import { searchRecipes } from '@/features/recipe';
import type { Recipe } from '@/features/recipe/types';

const SITEMAP_PAGE_SIZE = 100;
/** 与 ProductQueryFacade 的 pageSize 上限一致 */
const SITEMAP_PRODUCT_PAGE_SIZE = 48;
const SAFE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type SitemapEntry = MetadataRoute.Sitemap[number];

type PaginationMeta = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    pagination: PaginationMeta;
  };
};

function isValidSlug(slug?: string | null): slug is string {
  return typeof slug === 'string' && SAFE_SLUG_PATTERN.test(slug);
}

function parseLastModified(
  value: string | null | undefined,
  fallback: Date
): Date {
  if (!value) return fallback;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function createEntry(
  path: string,
  lastModified: Date,
  changeFrequency: NonNullable<SitemapEntry['changeFrequency']>,
  priority: number
): SitemapEntry {
  return {
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  };
}

async function fetchPaginatedData<T>(
  label: string,
  fetchPage: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
  try {
    const firstPage = await fetchPage(1, SITEMAP_PAGE_SIZE);
    const totalPages = Math.max(firstPage.meta.pagination.pageCount, 1);

    if (totalPages === 1) {
      return firstPage.data;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        fetchPage(index + 2, SITEMAP_PAGE_SIZE)
      )
    );

    return [firstPage, ...remainingPages].flatMap(response => response.data);
  } catch (error) {
    console.error(`[sitemap] Failed to fetch ${label}:`, error);
    return [];
  }
}

async function fetchAllArticles(): Promise<ArticleDetail[]> {
  return fetchPaginatedData(
    'articles',
    (page, pageSize) =>
      searchArticles({ page, pageSize }) as Promise<
        PaginatedResponse<ArticleDetail>
      >
  );
}

async function fetchAllRecipes(): Promise<Recipe[]> {
  return fetchPaginatedData(
    'recipes',
    (page, pageSize) =>
      searchRecipes({ page, pageSize }) as Promise<PaginatedResponse<Recipe>>
  );
}

async function fetchAllProducts(): Promise<ProductCardItem[]> {
  try {
    const first = await productQueryFacade.queryProducts({
      page: 1,
      pageSize: SITEMAP_PRODUCT_PAGE_SIZE,
      includeFacets: false,
    });
    const totalPages = Math.max(first.pagination.totalPages, 1);

    if (totalPages === 1) {
      return first.items;
    }

    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        productQueryFacade.queryProducts({
          page: index + 2,
          pageSize: SITEMAP_PRODUCT_PAGE_SIZE,
          includeFacets: false,
        })
      )
    );

    return [first, ...rest].flatMap(r => r.items);
  } catch (error) {
    console.error('[sitemap] Failed to fetch products:', error);
    return [];
  }
}

async function fetchShopCategoryNodes(): Promise<CategoryTreeNode[]> {
  try {
    const { categoryTree } = await getCategoryContextBySlug();
    const flat: CategoryTreeNode[] = [];

    const walk = (nodes: CategoryTreeNode[]) => {
      for (const node of nodes) {
        if (node.isActive) {
          flat.push(node);
        }
        if (node.children?.length) {
          walk(node.children);
        }
      }
    };

    walk(categoryTree);
    return flat;
  } catch (error) {
    console.error('[sitemap] Failed to fetch shop categories:', error);
    return [];
  }
}

async function fetchBlogCategories(): Promise<CategoryDetail[]> {
  try {
    const response = await fetchArticleCategories({
      rootOnly: true,
      includeChildren: true,
      level: '1-2',
    });
    return response.data;
  } catch (error) {
    console.error('[sitemap] Failed to fetch article categories:', error);
    return [];
  }
}

function buildCategoryEntries(
  categories: CategoryDetail[],
  now: Date
): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  for (const category of categories) {
    if (!isValidSlug(category.slug)) {
      console.warn(
        '[sitemap] Dropped invalid blog category slug:',
        category.slug
      );
    } else {
      entries.push(
        createEntry(
          `/blog/${category.slug}`,
          parseLastModified(category.updatedAt, now),
          'weekly',
          0.7
        )
      );
    }

    for (const child of category.children ?? []) {
      if (!isValidSlug(child.slug)) {
        console.warn(
          '[sitemap] Dropped invalid child blog category slug:',
          child.slug
        );
        continue;
      }

      entries.push(
        createEntry(
          `/blog/${child.slug}`,
          parseLastModified(child.updatedAt, now),
          'weekly',
          0.7
        )
      );
    }
  }

  return entries;
}

function buildArticleEntries(
  articles: ArticleDetail[],
  now: Date
): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  for (const article of articles) {
    const categorySlug = article.categories?.[0]?.slug;

    if (!isValidSlug(article.slug) || !isValidSlug(categorySlug)) {
      console.warn('[sitemap] Dropped invalid article entry:', {
        slug: article.slug,
        categorySlug,
      });
      continue;
    }

    entries.push(
      createEntry(
        `/blog/${categorySlug}/${article.slug}`,
        parseLastModified(article.publishedAt ?? article.updatedAt, now),
        'weekly',
        0.8
      )
    );
  }

  return entries;
}

/** 与 `RecipeCard` 一致：无分类时详情 URL 使用 `/recipes/recipe/{slug}` */
const RECIPE_FALLBACK_CATEGORY_SLUG = 'recipe';

function buildRecipeEntries(recipes: Recipe[], now: Date): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  let skippedEmptySlug = 0;

  for (const recipe of recipes) {
    const slugSegment =
      typeof recipe.slug === 'string' ? recipe.slug.trim() : '';
    if (!slugSegment) {
      skippedEmptySlug += 1;
      continue;
    }

    const rawCategorySlug = recipe.categories?.[0]?.slug?.trim();
    const categorySegment =
      rawCategorySlug && !rawCategorySlug.includes('/')
        ? rawCategorySlug
        : RECIPE_FALLBACK_CATEGORY_SLUG;

    const path = `/recipes/${encodeURIComponent(
      categorySegment
    )}/${encodeURIComponent(slugSegment)}`;

    entries.push(
      createEntry(
        path,
        parseLastModified(recipe.updatedAt ?? recipe.createdAt, now),
        'weekly',
        0.8
      )
    );
  }

  if (skippedEmptySlug > 0) {
    console.warn(
      `[sitemap] Skipped ${skippedEmptySlug} recipe(s) with empty slug`
    );
  }

  return entries;
}

function buildProductEntries(
  products: ProductCardItem[],
  now: Date
): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  for (const product of products) {
    const segment = (product.urlKey ?? product.sku)?.trim();
    if (!segment) {
      console.warn(
        '[sitemap] Dropped product without urlKey/sku:',
        product.sku
      );
      continue;
    }

    const path = `/products/${encodeURIComponent(segment)}`;
    const lastModified =
      typeof product.createdAt === 'number' && product.createdAt > 0
        ? new Date(
            product.createdAt < 1e12
              ? product.createdAt * 1000
              : product.createdAt
          )
        : now;

    entries.push(createEntry(path, lastModified, 'weekly', 0.85));
  }

  return entries;
}

function buildShopCategoryEntries(
  nodes: CategoryTreeNode[],
  now: Date
): SitemapEntry[] {
  return nodes.map(node =>
    createEntry(
      `/categories/${encodeURIComponent(node.slug)}`,
      now,
      'weekly',
      0.75
    )
  );
}

function buildCmsPageEntries(
  rows: CmsPageSitemapRow[],
  now: Date
): SitemapEntry[] {
  return rows.map(row =>
    createEntry(
      `/${encodeURIComponent(row.slug)}`,
      parseLastModified(row.lastModified, now),
      'weekly',
      0.65
    )
  );
}

function dedupeEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const uniqueEntries = new Map<string, SitemapEntry>();

  for (const entry of entries) {
    const existing = uniqueEntries.get(entry.url);

    if (!existing) {
      uniqueEntries.set(entry.url, entry);
      continue;
    }

    const existingTime = existing.lastModified
      ? new Date(existing.lastModified).getTime()
      : 0;
    const nextTime = entry.lastModified
      ? new Date(entry.lastModified).getTime()
      : 0;

    if (nextTime > existingTime) {
      uniqueEntries.set(entry.url, entry);
    }
  }

  return Array.from(uniqueEntries.values()).sort((a, b) =>
    a.url.localeCompare(b.url)
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [
    blogCategories,
    articles,
    recipes,
    products,
    shopCategoryNodes,
    cmsPages,
  ] = await Promise.all([
    fetchBlogCategories(),
    fetchAllArticles(),
    fetchAllRecipes(),
    fetchAllProducts(),
    fetchShopCategoryNodes(),
    fetchAllCmsPagesForSitemap(),
  ]);

  return dedupeEntries([
    createEntry('/', now, 'daily', 1),
    createEntry('/blog', now, 'daily', 0.9),
    createEntry('/recipes', now, 'daily', 0.9),
    ...buildCategoryEntries(blogCategories, now),
    ...buildArticleEntries(articles, now),
    ...buildRecipeEntries(recipes, now),
    ...buildShopCategoryEntries(shopCategoryNodes, now),
    ...buildProductEntries(products, now),
    ...buildCmsPageEntries(cmsPages, now),
  ]);
}
