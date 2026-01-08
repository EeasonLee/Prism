/**
 * API 类型工具函数
 *
 * 提供类型提取、转换和工具类型
 */

import type { ApiResponse, PaginatedResponse } from './common';

/**
 * 提取 API 响应中的数据类型
 *
 * @example
 * type ArticleData = ExtractResponseData<ApiResponse<Article>>;
 */
export type ExtractResponseData<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * 提取分页响应中的数据类型
 *
 * @example
 * type ArticleItem = ExtractPaginatedData<PaginatedResponse<ArticleListItem>>;
 */
export type ExtractPaginatedData<T> = T extends PaginatedResponse<
  infer U,
  unknown
>
  ? U
  : never;

/**
 * 提取分页响应中的 Meta 类型
 *
 * @example
 * type Meta = ExtractPaginatedMeta<PaginatedResponse<ArticleListItem, CustomMeta>>;
 */
export type ExtractPaginatedMeta<T> = T extends PaginatedResponse<
  unknown,
  infer M
>
  ? M
  : never;

/**
 * 请求参数类型
 * 所有属性都是可选的，便于构建查询参数
 *
 * @example
 * interface ArticleSearchParams extends RequestParams<{
 *   keyword: string;
 *   category: string;
 *   page: number;
 * }> {}
 */
export type RequestParams<T extends Record<string, unknown>> = {
  [K in keyof T]?: T[K];
};

/**
 * 查询参数类型
 * 通用的 API 查询参数结构
 */
export interface QueryParams {
  /** 页码（从 1 开始） */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序字段和方向 */
  sort?: string;
  /** 过滤条件 */
  filters?: Record<string, unknown>;
  /** 搜索关键词 */
  search?: string;
  /** 其他自定义参数 */
  [key: string]: unknown;
}

/**
 * 构建查询字符串的参数类型
 */
export interface BuildQueryParamsOptions {
  /** 是否编码参数值 */
  encode?: boolean;
  /** 是否跳过空值 */
  skipEmpty?: boolean;
  /** 自定义参数格式化函数 */
  formatter?: (key: string, value: unknown) => string | null;
}

/**
 * 将对象转换为查询字符串
 *
 * @param params - 查询参数对象
 * @param options - 构建选项
 * @returns 查询字符串（不包含前导 ?）
 *
 * @example
 * const query = buildQueryString({ page: 1, size: 10 });
 * // => "page=1&size=10"
 */
export function buildQueryString(
  params: QueryParams,
  options: BuildQueryParamsOptions = {}
): string {
  const { encode = true, skipEmpty = true, formatter } = options;
  const pairs: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (skipEmpty && (value === null || value === undefined || value === '')) {
      continue;
    }

    let formattedValue: string | null = null;

    if (formatter) {
      formattedValue = formatter(key, value);
    } else if (Array.isArray(value)) {
      formattedValue = value.map(v => String(v)).join(',');
    } else if (typeof value === 'object') {
      formattedValue = JSON.stringify(value);
    } else {
      formattedValue = String(value);
    }

    if (formattedValue !== null) {
      const encodedKey = encode ? encodeURIComponent(key) : key;
      const encodedValue = encode
        ? encodeURIComponent(formattedValue)
        : formattedValue;
      pairs.push(`${encodedKey}=${encodedValue}`);
    }
  }

  return pairs.join('&');
}

/**
 * 解析查询字符串为对象
 *
 * @param queryString - 查询字符串（可包含或不包含前导 ?）
 * @returns 解析后的参数对象
 *
 * @example
 * const params = parseQueryString("page=1&size=10");
 * // => { page: "1", size: "10" }
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const cleanQuery = queryString.startsWith('?')
    ? queryString.slice(1)
    : queryString;

  if (!cleanQuery) {
    return params;
  }

  const pairs = cleanQuery.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(decodeURIComponent);
    if (key) {
      params[key] = value || '';
    }
  }

  return params;
}
