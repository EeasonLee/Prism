/**
 * Blog API 查询函数
 */

import { isServerSide } from '@prism/shared';
import type { ApiClientAdapter } from './client-adapter';
import type {
  ArticleBySlugResponse,
  ArticleSearchResponse,
  ArticleSort,
  ArticleTag,
  CategoryBySlugResponse,
  CategoryDetail,
} from './types';

// 默认 apiClient（由应用层注入）
let defaultApiClient: ApiClientAdapter | null = null;

/**
 * 设置默认 API Client（由应用层调用）
 */
export function setApiClient(client: ApiClientAdapter): void {
  defaultApiClient = client;
}

/**
 * 获取 API Client（如果未设置则抛出错误）
 */
function getApiClient(): ApiClientAdapter {
  if (!defaultApiClient) {
    throw new Error(
      'API Client not initialized. Call setApiClient() from @prism/blog/api/queries first.'
    );
  }
  return defaultApiClient;
}

function buildQuery(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        qs.append(key, value.join(','));
      }
    } else {
      qs.append(key, String(value));
    }
  });
  return qs.toString();
}

export async function searchArticles(params: {
  q?: string;
  page?: number;
  pageSize?: number;
  categoryIds?: number[];
  tagIds?: number[];
  sort?: ArticleSort;
  locale?: string;
  signal?: AbortSignal;
}): Promise<ArticleSearchResponse> {
  const queryString = buildQuery({
    q: params.q,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    categoryIds:
      params.categoryIds && params.categoryIds.length > 0
        ? params.categoryIds.join(',')
        : undefined,
    tagIds:
      params.tagIds && params.tagIds.length > 0 ? params.tagIds : undefined,
    sort: params.sort ?? 'publishedAt:desc',
    locale: params.locale,
  });
  return getApiClient().get<ArticleSearchResponse>(
    `api/articles/search?${queryString}`,
    {
      signal: params.signal,
    }
  );
}

export async function fetchArticleCategories(_params?: {
  rootOnly?: boolean;
  includeChildren?: boolean;
  level?: string;
  locale?: string;
}): Promise<{ data: CategoryDetail[] }> {
  // 直接使用 /api/categories，不添加任何查询参数
  const endpoint = `api/categories`;
  const options = isServerSide()
    ? ({ next: { revalidate: 3600 } } as const)
    : undefined;
  return getApiClient().get<{ data: CategoryDetail[] }>(endpoint, options);
}

export async function fetchCategoryCounts(params?: {
  locale?: string;
}): Promise<{ data: CategoryDetail[] }> {
  const queryString = buildQuery({ locale: params?.locale });
  const endpoint = `api/categories/article-counts${
    queryString ? `?${queryString}` : ''
  }`;
  const options = isServerSide()
    ? ({ next: { revalidate: 3600 }, skipLogging: true } as const)
    : { skipLogging: true };
  return getApiClient().get<{ data: CategoryDetail[] }>(endpoint, options);
}

export async function fetchArticleTags(params?: {
  locale?: string;
}): Promise<{ data: ArticleTag[] }> {
  const queryString = buildQuery({ locale: params?.locale });
  const endpoint = `api/tags${queryString ? `?${queryString}` : ''}`;
  const options = isServerSide()
    ? ({ next: { revalidate: 3600 } } as const)
    : undefined;
  return getApiClient().get<{ data: ArticleTag[] }>(endpoint, options);
}

/**
 * 根据 slug 获取分类详情（包含子分类）
 */
export async function fetchCategoryBySlug(
  slug: string,
  params?: {
    includeChildrenArticles?: boolean;
  }
): Promise<CategoryBySlugResponse> {
  const queryString = buildQuery({
    includeChildrenArticles: params?.includeChildrenArticles,
  });
  const endpoint = `api/categories/slug/${slug}${
    queryString ? `?${queryString}` : ''
  }`;
  const options = isServerSide()
    ? ({ next: { revalidate: 3600 } } as const)
    : undefined;
  return getApiClient().get<CategoryBySlugResponse>(endpoint, options);
}

/**
 * 根据 type 获取分类
 */
export async function fetchCategoryByType(
  type: string,
  params?: {
    includeChildrenArticles?: boolean;
  }
): Promise<CategoryBySlugResponse> {
  const queryString = buildQuery({
    type,
    includeChildrenArticles: params?.includeChildrenArticles,
  });
  const endpoint = `api/categories${queryString ? `?${queryString}` : ''}`;
  const options = isServerSide()
    ? ({ next: { revalidate: 3600 } } as const)
    : undefined;
  return getApiClient().get<CategoryBySlugResponse>(endpoint, options);
}

/**
 * 根据 slug 获取文章详情
 */
export async function fetchArticleBySlug(
  slug: string,
  locale?: string
): Promise<ArticleBySlugResponse> {
  const queryString = buildQuery({ locale });
  const endpoint = `api/articles/slug/${slug}${
    queryString ? `?${queryString}` : ''
  }`;
  const options = isServerSide()
    ? ({ next: { revalidate: 3600 } } as const)
    : undefined;
  return getApiClient().get<ArticleBySlugResponse>(endpoint, options);
}
