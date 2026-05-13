/**
 * Blog API 查询函数
 */

import { isServerSide } from '@prism/shared';
import { ApiError, NetworkError } from '@/infrastructure/api/errors';
import { strapiClient } from '@/infrastructure/api/clients/strapi';
import type {
  ArticleBySlugResponse,
  ArticleSearchResponse,
  ArticleSort,
  ArticleTag,
  CategoryBySlugResponse,
  CategoryDetail,
} from './types';

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

/**
 * 浏览器同源 BFF：解析 JSON，错误形态与 apiClient 对齐。
 */
async function fetchBffJson<T>(relativePath: string): Promise<T> {
  const response = await fetch(relativePath, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new NetworkError('Failed to parse response body');
  }

  if (!response.ok) {
    let message = `API request failed: ${response.statusText}`;
    if (data && typeof data === 'object') {
      const err = (data as Record<string, unknown>).error;
      if (typeof err === 'string') {
        message = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        message = String((err as { message: unknown }).message);
      }
    }
    throw new ApiError(message, response.status, undefined, data);
  }

  // 拆解 BFF 统一响应信封 { success, data, error }
  if (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    (data as Record<string, unknown>).success === true &&
    'data' in data
  ) {
    return (data as { data: T }).data;
  }

  return data as T;
}

/**
 * 服务端直连 Strapi 搜索文章
 */
async function searchArticlesStrapi(params: {
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
  return strapiClient.get<ArticleSearchResponse>(
    `api/articles/search?${queryString}`,
    {
      signal: params.signal,
    }
  );
}

/**
 * 搜索文章（统一入口）
 *
 * - 服务端：直连 Strapi
 * - 客户端：通过 Next.js BFF 路由代理
 */
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

  if (!isServerSide()) {
    return fetchBffJson<ArticleSearchResponse>(
      `/api/articles/search?${queryString}`
    );
  }

  return searchArticlesStrapi(params);
}

export async function fetchArticleCategories(_params?: {
  rootOnly?: boolean;
  includeChildren?: boolean;
  level?: string;
  locale?: string;
}): Promise<{ data: CategoryDetail[] }> {
  const endpoint = `api/categories`;
  const options = isServerSide()
    ? ({ next: { revalidate: 3600 } } as const)
    : undefined;
  return strapiClient.get<{ data: CategoryDetail[] }>(endpoint, options);
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
  return strapiClient.get<{ data: CategoryDetail[] }>(endpoint, options);
}

export async function fetchArticleTags(params?: {
  locale?: string;
}): Promise<{ data: ArticleTag[] }> {
  const queryString = buildQuery({ locale: params?.locale });
  const endpoint = `api/tags${queryString ? `?${queryString}` : ''}`;
  const options = isServerSide()
    ? ({ next: { revalidate: 3600 } } as const)
    : undefined;
  return strapiClient.get<{ data: ArticleTag[] }>(endpoint, options);
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
  return strapiClient.get<CategoryBySlugResponse>(endpoint, options);
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
  return strapiClient.get<ArticleBySlugResponse>(endpoint, options);
}
