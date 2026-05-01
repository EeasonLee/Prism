import type {
  FilterListResponse,
  FilterTypesResponse,
  Recipe,
  RecipeSearchParams,
  RecipeSearchResponse,
  SearchRecipesResponse,
} from '../../app/recipes/types';

import { ApiError, NetworkError } from '@/core/api/errors';

import { REVALIDATE_SECONDS_CMS_ASSOCIATION } from './cache-policy';
import { strapiClient as apiClient } from '@/core/api/clients/strapi';
import { isServerSide } from './config';

/**
 * 构建查询字符串
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.append(key, value.join(','));
      }
    } else if (typeof value === 'boolean') {
      searchParams.append(key, value.toString());
    } else {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

function buildRecipeFacetedQueryRecord(
  params: RecipeSearchParams
): Record<string, unknown> {
  const queryParams: Record<string, unknown> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 12,
    includeFacets: params.includeFacets ?? false,
  };

  if (params.recipeTypes && params.recipeTypes.length > 0) {
    queryParams.recipeTypes = params.recipeTypes;
  }
  if (params.ingredients && params.ingredients.length > 0) {
    queryParams.ingredients = params.ingredients;
  }
  if (params.cuisines && params.cuisines.length > 0) {
    queryParams.cuisines = params.cuisines;
  }
  if (params.dishTypes && params.dishTypes.length > 0) {
    queryParams.dishTypes = params.dishTypes;
  }
  if (params.specialDiets && params.specialDiets.length > 0) {
    queryParams.specialDiets = params.specialDiets;
  }
  if (params.holidaysEvents && params.holidaysEvents.length > 0) {
    queryParams.holidaysEvents = params.holidaysEvents;
  }
  if (params.productTypes && params.productTypes.length > 0) {
    queryParams.productTypes = params.productTypes;
  }
  if (params.categoryId) {
    queryParams.categoryId = params.categoryId;
  }

  return queryParams;
}

function buildRecipeKeywordQueryRecord(params: {
  q: string;
  page?: number;
  pageSize?: number;
  tags?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  cookTimeGte?: number;
  cookTimeLte?: number;
  ratingGte?: number;
  sort?: string | string[];
}): Record<string, unknown> {
  return {
    q: params.q,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 12,
    tags: params.tags,
    difficulty: params.difficulty,
    cookTimeGte: params.cookTimeGte,
    cookTimeLte: params.cookTimeLte,
    ratingGte: params.ratingGte,
    sort: Array.isArray(params.sort) ? params.sort.join(',') : params.sort,
  };
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
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `API request failed: ${response.statusText}`;
    throw new ApiError(message, response.status, undefined, data);
  }

  return data as T;
}

/**
 * 服务端 / BFF Route：直连 Strapi 的分面搜索（含 token）。
 */
export async function fetchRecipeFacetedSearchStrapi(
  params: RecipeSearchParams
): Promise<RecipeSearchResponse> {
  const queryString = buildQueryString(buildRecipeFacetedQueryRecord(params));
  return apiClient.get<RecipeSearchResponse>(
    `api/recipes/search?${queryString}`
  );
}

/**
 * 服务端 / BFF Route：直连 Strapi 的关键字搜索（含 token）。
 */
export async function fetchRecipeKeywordSearchStrapi(params: {
  q: string;
  page?: number;
  pageSize?: number;
  tags?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  cookTimeGte?: number;
  cookTimeLte?: number;
  ratingGte?: number;
  sort?: string | string[];
}): Promise<SearchRecipesResponse> {
  const queryString = buildQueryString(buildRecipeKeywordQueryRecord(params));
  return apiClient.get<SearchRecipesResponse>(
    `api/search/recipes?${queryString}`
  );
}

/**
 * 获取筛选类型列表
 */
export async function getFilterTypes(): Promise<FilterTypesResponse> {
  return apiClient.get<FilterTypesResponse>('api/recipe-filters/types');
}

/**
 * 获取筛选选项列表
 */
export async function getFilters(params?: {
  type?: string;
  rootOnly?: boolean;
  includeChildren?: boolean;
  sort?: string[];
}): Promise<FilterListResponse> {
  const queryParams: Record<string, string> = {};

  if (params?.type) {
    queryParams.type = params.type;
  }
  if (params?.rootOnly !== undefined) {
    queryParams.rootOnly = params.rootOnly.toString();
  }
  if (params?.includeChildren !== undefined) {
    queryParams.includeChildren = params.includeChildren.toString();
  }
  if (params?.sort) {
    queryParams.sort = params.sort.join(',');
  }

  const queryString = buildQueryString(queryParams);
  const endpoint = `api/recipe-filters${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<FilterListResponse>(endpoint);
}

/**
 * 按关键字搜索食谱（新搜索接口）
 */
export async function searchRecipesByKeyword(params: {
  q: string;
  page?: number;
  pageSize?: number;
  tags?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  cookTimeGte?: number;
  cookTimeLte?: number;
  ratingGte?: number;
  sort?: string | string[];
}): Promise<SearchRecipesResponse> {
  const queryString = buildQueryString(buildRecipeKeywordQueryRecord(params));

  if (!isServerSide()) {
    return fetchBffJson<SearchRecipesResponse>(
      `/api/search/recipes?${queryString}`
    );
  }

  return fetchRecipeKeywordSearchStrapi(params);
}

/**
 * 搜索食谱（支持 Faceted Search）
 */
export async function searchRecipes(
  params: RecipeSearchParams
): Promise<RecipeSearchResponse> {
  const queryString = buildQueryString(buildRecipeFacetedQueryRecord(params));

  if (!isServerSide()) {
    return fetchBffJson<RecipeSearchResponse>(
      `/api/recipes/search?${queryString}`
    );
  }

  return fetchRecipeFacetedSearchStrapi(params);
}

/**
 * 根据 slug 获取食谱详情
 * @param slug 食谱 slug
 * @param revalidate 重新验证时间（秒），用于 Next.js Data Cache（仅服务端有效）。
 *   必须显式传入有效数值，否则 fetch 不缓存会导致 Full Route Cache 被禁用。与路由 revalidate 一致（见 `REVALIDATE_SECONDS_CMS_ASSOCIATION`）。
 */
export async function getRecipeBySlug(
  slug: string,
  revalidate = REVALIDATE_SECONDS_CMS_ASSOCIATION
): Promise<{ data: Recipe }> {
  const endpoint = `api/recipes/slug/${slug}`;

  // 只在服务端支持缓存配置
  const options = isServerSide()
    ? ({ next: { revalidate } } as const)
    : undefined;

  return apiClient.get<{ data: Recipe }>(endpoint, options);
}
