import type {
  FilterListResponse,
  FilterTypesResponse,
  Recipe,
  RecipeSearchParams,
  RecipeSearchResponse,
} from '../../app/recipes/types';

import { env, IS_DEVELOPMENT } from '../env';

/**
 * 获取 API 基础 URL
 * - 客户端：使用 Next.js 代理路由（/api/proxy），避免 CORS 问题
 */
function getApiBaseUrl(): string {
  if (IS_DEVELOPMENT) {
    return '/api/proxy';
  }

  const baseUrl = env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }

  if (baseUrl.endsWith('/api')) {
    return baseUrl;
  }

  if (baseUrl.endsWith('/')) {
    return `${baseUrl}api`;
  }

  return `${baseUrl}/api`;
}

const API_BASE_URL = getApiBaseUrl();

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
  const response = await fetch(`${API_BASE_URL}/recipe-filters/types`);

  if (!response.ok) {
    throw new Error(`Failed to fetch filter types: ${response.statusText}`);
  }

  return response.json() as Promise<FilterTypesResponse>;
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
  const url = `${API_BASE_URL}/recipe-filters${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch filters: ${response.statusText}`);
  }

  return response.json() as Promise<FilterListResponse>;
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

  const queryString = buildQueryString(queryParams);
  const url = `${API_BASE_URL}/recipes/search?${queryString}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to search recipes: ${response.statusText}`);
  }

  return response.json() as Promise<RecipeSearchResponse>;
}

/**
 * 根据 slug 获取食谱详情
 * @param slug 食谱 slug
 * @param revalidate 重新验证时间（秒），用于 Next.js 缓存
 */
export async function getRecipeBySlug(
  slug: string,
  revalidate = 3600
): Promise<{ data: Recipe }> {
  const url = `${API_BASE_URL}/recipes/slug/${slug}`;

  try {
    // 服务端请求配置
    // 注意：在开发环境中，如果 API 服务器未运行，这里会失败
    const response = await fetch(url, {
      next: { revalidate }, // Next.js 缓存配置
      headers: {
        'Content-Type': 'application/json',
      },
      // 开发环境不使用缓存，生产环境使用 revalidate
      ...(process.env.NODE_ENV === 'development' && { cache: 'no-store' }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Recipe not found: ${slug}`);
      }
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch recipe (${response.status}): ${
          errorText || response.statusText
        }`
      );
    }

    const data = (await response.json()) as { data: Recipe };

    // 验证返回数据结构
    if (!data || !data.data) {
      throw new Error('Invalid response format from API');
    }

    return data;
  } catch (error) {
    // 如果是网络错误，提供更详细的错误信息
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const errorMessage = `Network error: Unable to connect to API server.
      
Request URL: ${url}
API Base URL: ${API_BASE_URL}
Slug: ${slug}

Please check:
1. Is the API server running?
2. Is NEXT_PUBLIC_API_URL configured correctly?
3. Can you access ${API_BASE_URL} from your network?`;

      // 在开发环境中，输出更详细的错误信息
      if (process.env.NODE_ENV === 'development') {
        console.error('API Request Error:', {
          url,
          apiBaseUrl: API_BASE_URL,
          slug,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      throw new Error(errorMessage);
    }
    throw error;
  }
}
