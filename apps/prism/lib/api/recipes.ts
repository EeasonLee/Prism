import type {
  FilterListResponse,
  FilterTypesResponse,
  Recipe,
  RecipeSearchParams,
  RecipeSearchResponse,
  SearchRecipesResponse,
} from '../../app/recipes/types';

import { apiClient } from './client';

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

/**
 * 获取筛选类型列表
 */
export async function getFilterTypes(): Promise<FilterTypesResponse> {
  return apiClient.get<FilterTypesResponse>('recipe-filters/types');
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
  const endpoint = `recipe-filters${queryString ? `?${queryString}` : ''}`;

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
  const queryParams: Record<string, unknown> = {
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

  const queryString = buildQueryString(queryParams);
  const endpoint = `search/recipes?${queryString}`;

  return apiClient.get<SearchRecipesResponse>(endpoint);
}

/**
 * 搜索食谱（支持 Faceted Search）
 */
export async function searchRecipes(
  params: RecipeSearchParams
): Promise<RecipeSearchResponse> {
  const queryParams: Record<string, unknown> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 12,
    includeFacets: params.includeFacets ?? false,
  };

  // 添加筛选条件
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

  const queryString = buildQueryString(queryParams);
  const endpoint = `recipes/search?${queryString}`;

  return apiClient.get<RecipeSearchResponse>(endpoint);
}

/**
 * 根据 slug 获取食谱详情
 * @param slug 食谱 slug
 * @param revalidate 重新验证时间（秒），用于 Next.js ISR 缓存（仅服务端有效）
 */
export async function getRecipeBySlug(
  slug: string,
  revalidate = 3600
): Promise<{ data: Recipe }> {
  const endpoint = `recipes/slug/${slug}`;

  // 只在服务端支持缓存配置
  const options =
    typeof (globalThis as any).window === 'undefined'
      ? ({ next: { revalidate } } as const)
      : undefined;

  return apiClient.get<{ data: Recipe }>(endpoint, options);
}
