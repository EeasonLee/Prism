/**
 * 类型守卫函数
 *
 * 提供运行时类型检查，用于类型收窄（Type Narrowing）
 */

import type { ApiResponse, PaginatedResponse } from '../api/types/common';
import { ApiError } from '../api/types/errors';

/**
 * 检查值是否为 API 响应类型
 *
 * @param value - 待检查的值
 * @returns 是否为 ApiResponse 类型
 *
 * @example
 * if (isApiResponse<Article>(response)) {
 *   // response 的类型被收窄为 ApiResponse<Article>
 *   console.log(response.data);
 * }
 */
export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return 'data' in obj && typeof obj['data'] !== 'undefined';
}

/**
 * 检查值是否为分页响应类型
 *
 * @param value - 待检查的值
 * @returns 是否为 PaginatedResponse 类型
 *
 * @example
 * if (isPaginatedResponse<ArticleListItem>(response)) {
 *   // response 的类型被收窄为 PaginatedResponse<ArticleListItem>
 *   console.log(response.data.length);
 *   console.log(response.meta.pagination);
 * }
 */
export function isPaginatedResponse<T>(
  value: unknown
): value is PaginatedResponse<T> {
  if (!isApiResponse<T[]>(value)) {
    return false;
  }

  const meta = (value as ApiResponse<T[]>).meta;
  if (typeof meta !== 'object' || meta === null) {
    return false;
  }
  const metaObj = meta as Record<string, unknown>;
  return 'pagination' in metaObj && typeof metaObj['pagination'] === 'object';
}

/**
 * 检查错误是否为 ApiError 类型
 *
 * @param error - 待检查的错误
 * @returns 是否为 ApiError 类型
 *
 * @example
 * try {
 *   await fetchArticle();
 * } catch (error) {
 *   if (isApiError(error)) {
 *     // error 的类型被收窄为 ApiError
 *     console.log(error.status, error.code);
 *   }
 * }
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * 检查值是否为 Error 类型
 *
 * @param error - 待检查的值
 * @returns 是否为 Error 类型
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * 检查值是否非空（非 null 和 undefined）
 *
 * @param value - 待检查的值
 * @returns 是否非空
 *
 * @example
 * const items = [1, null, 2, undefined, 3].filter(isNotNull);
 * // items 的类型为 number[]
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 检查值是否为字符串
 *
 * @param value - 待检查的值
 * @returns 是否为字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 检查值是否为数字
 *
 * @param value - 待检查的值
 * @returns 是否为数字
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 检查值是否为数组
 *
 * @param value - 待检查的值
 * @returns 是否为数组
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 检查值是否为对象（非 null 和数组）
 *
 * @param value - 待检查的值
 * @returns 是否为对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 检查对象是否包含指定键
 *
 * @param obj - 对象
 * @param key - 键名
 * @returns 是否包含该键
 *
 * @example
 * if (hasKey(data, 'id')) {
 *   // data 的类型被收窄为包含 'id' 属性的对象
 *   console.log(data.id);
 * }
 */
export function hasKey<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}
