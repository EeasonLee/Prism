import type {
  FilterListResponse,
  FilterTypesResponse,
  Recipe,
  RecipeSearchParams,
  RecipeSearchResponse,
} from '../../app/recipes/types';

import { env } from '../env';

/**
 * 判断是否在服务端运行
 */
function isServerSide(): boolean {
  return typeof window === 'undefined';
}

/**
 * 获取 API 基础 URL
 * - 客户端：使用 /api/proxy 代理（避免跨域）
 * - 服务端：直接请求后端（没有跨域问题，但需要模拟浏览器请求）
 */
function getApiBaseUrl(): string {
  if (isServerSide()) {
    // 服务端：直接使用后端地址
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

  // 客户端：使用相对路径代理，浏览器会自动处理
  return '/api/proxy';
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
 * 获取请求头
 * - 服务端：添加 API Token 认证，完全模拟浏览器请求
 * - 客户端：使用默认头即可（浏览器会自动添加）
 */
function getRequestHeaders(): HeadersInit {
  if (isServerSide()) {
    const headers: HeadersInit = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      // 设置 Referer 和 Origin 为后端地址，让后端认为请求来自自己的页面
      Referer: env.NEXT_PUBLIC_API_URL || '',
      Origin: env.NEXT_PUBLIC_API_URL || '',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    };

    // 服务端：添加 API Token 认证（仅在服务端使用，不会暴露到客户端）
    if (env.STRAPI_API_TOKEN) {
      headers['token'] = `${env.STRAPI_API_TOKEN}`;
      // 调试：确认 token 已读取（只显示前 10 个字符）
      console.log(
        '🔑 Token 已加载:',
        env.STRAPI_API_TOKEN.substring(0, 10) +
          '... (长度: ' +
          env.STRAPI_API_TOKEN.length +
          ')'
      );
    } else {
      console.warn('⚠️  STRAPI_API_TOKEN 未配置！服务端请求可能失败');
    }

    return headers;
  }

  // 客户端：浏览器会自动添加所有必要的头
  return {
    Accept: 'application/json',
  };
}

/**
 * 调试日志：打印详细的请求和响应信息
 */
async function logRequestDetails(
  url: string,
  headers: HeadersInit,
  response: Response,
  error?: Error
): Promise<void> {
  const isServer = isServerSide();
  const logPrefix = `[${isServer ? 'SERVER' : 'CLIENT'}] API Request`;

  console.group(`🔍 ${logPrefix} Debug Info`);
  console.log('📍 URL:', url);
  console.log('🌐 Environment:', isServer ? 'Server-Side' : 'Client-Side');

  // 安全地打印请求头（隐藏敏感信息）
  const safeHeaders = { ...headers };
  if (
    'Authorization' in safeHeaders &&
    typeof safeHeaders.Authorization === 'string'
  ) {
    const authHeader = safeHeaders.Authorization as string;
    // 只显示前 20 个字符，隐藏 token 内容
    safeHeaders.Authorization = authHeader.substring(0, 20) + '...***';
  }
  console.log('📤 Request Headers:', JSON.stringify(safeHeaders, null, 2));
  console.log('📥 Response Status:', response.status, response.statusText);
  console.log(
    '📥 Response Headers:',
    Object.fromEntries(response.headers.entries())
  );

  // 尝试读取响应体（用于错误信息）
  try {
    const responseText = await response.clone().text();
    console.log('📥 Response Body:', responseText.substring(0, 500)); // 限制长度
  } catch {
    console.log('📥 Response Body: (无法读取)');
  }

  if (error) {
    console.error('❌ Error:', error);
  }

  // 如果是 403，提供诊断建议
  if (response.status === 403) {
    console.warn('⚠️  403 Forbidden 可能的原因:');
    console.warn('  1. 后端检查了请求来源（IP/Referer/Origin）');
    console.warn('  2. 后端需要认证（Token/Cookie）');
    console.warn('  3. 后端有 WAF/防火墙规则');
    console.warn('  4. User-Agent 被识别为非浏览器');
  }

  console.groupEnd();
}

/**
 * 获取筛选类型列表
 */
export async function getFilterTypes(): Promise<FilterTypesResponse> {
  const url = `${API_BASE_URL}/recipe-filters/types`;
  console.log('🚀 ~ getFilterTypes ~ url:', url);
  const headers = getRequestHeaders();

  // 服务端 API_BASE_URL 已经是绝对地址，客户端是相对路径
  const response = await fetch(url, {
    headers,
  });

  // 打印详细日志（仅在开发环境或错误时）
  if (!response.ok || process.env.NODE_ENV === 'development') {
    await logRequestDetails(url, headers, response);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '无法读取错误信息');
    throw new Error(
      `Failed to fetch filter types: ${response.status} ${
        response.statusText
      }\nResponse: ${errorText.substring(0, 200)}`
    );
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
  const headers = getRequestHeaders();

  // 服务端 API_BASE_URL 已经是绝对地址，客户端是相对路径
  const response = await fetch(url, {
    headers,
  });

  // 打印详细日志（仅在开发环境或错误时）
  if (!response.ok || process.env.NODE_ENV === 'development') {
    await logRequestDetails(url, headers, response);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '无法读取错误信息');
    throw new Error(
      `Failed to fetch filters: ${response.status} ${
        response.statusText
      }\nResponse: ${errorText.substring(0, 200)}`
    );
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
  if (params.categoryId) {
    queryParams.categoryId = params.categoryId;
  }

  const queryString = buildQueryString(queryParams);
  const url = `${API_BASE_URL}/recipes/search?${queryString}`;
  const headers = getRequestHeaders();

  // 服务端 API_BASE_URL 已经是绝对地址，客户端是相对路径
  const response = await fetch(url, {
    headers,
  });

  // 打印详细日志（仅在开发环境或错误时）
  if (!response.ok || process.env.NODE_ENV === 'development') {
    await logRequestDetails(url, headers, response);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '无法读取错误信息');
    throw new Error(
      `Failed to search recipes: ${response.status} ${
        response.statusText
      }\nResponse: ${errorText.substring(0, 200)}`
    );
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
  console.log('🚀 ~ getFilterTypes ~ url:', url);
  console.log('🚀 ~ getFilterTypes ~ url:', url);
  console.log('🚀 ~ getFilterTypes ~ url:', url);
  // 服务端 API_BASE_URL 已经是绝对地址，客户端是相对路径

  try {
    // 服务端请求配置
    // 注意：在开发环境中，如果 API 服务器未运行，这里会失败
    const response = await fetch(url, {
      next: { revalidate }, // Next.js 缓存配置
      headers: {
        'Content-Type': 'application/json',
        ...getRequestHeaders(),
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
