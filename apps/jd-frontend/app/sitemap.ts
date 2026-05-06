import {
  fetchArticleCategories,
  searchArticles,
  type ArticleDetail,
  type CategoryDetail,
} from '@/features/blog/api';
import { absoluteUrl } from '@/shared/utils/seo';
import type { MetadataRoute } from 'next';
import { searchRecipes } from '@/features/recipe';
import type { Recipe } from '@/features/recipe/types';

const SITEMAP_PAGE_SIZE = 100;
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

function buildRecipeEntries(recipes: Recipe[], now: Date): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  for (const recipe of recipes) {
    const categorySlug = recipe.categories?.[0]?.slug;

    if (!isValidSlug(recipe.slug) || !isValidSlug(categorySlug)) {
      console.warn('[sitemap] Dropped invalid recipe entry:', {
        slug: recipe.slug,
        categorySlug,
      });
      continue;
    }

    entries.push(
      createEntry(
        `/recipes/${categorySlug}/${recipe.slug}`,
        parseLastModified(recipe.updatedAt ?? recipe.createdAt, now),
        'weekly',
        0.8
      )
    );
  }

  return entries;
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

  const [categories, articles, recipes] = await Promise.all([
    fetchBlogCategories(),
    fetchAllArticles(),
    fetchAllRecipes(),
  ]);

  return dedupeEntries([
    createEntry('/', now, 'daily', 1),
    createEntry('/blog', now, 'daily', 0.9),
    createEntry('/recipes', now, 'daily', 0.9),
    ...buildCategoryEntries(categories, now),
    ...buildArticleEntries(articles, now),
    ...buildRecipeEntries(recipes, now),
  ]);
}
