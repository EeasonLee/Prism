/**
 * API 通用响应类型
 */

/**
 * 通用 API 响应类型
 * @template T 响应数据类型
 */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * 分页响应类型
 * @template T 数据项类型
 * @template M 额外的 meta 信息类型（默认为空对象）
 */
export interface PaginatedResponse<T, M = Record<string, unknown>> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  } & M;
}

/**
 * API 错误响应类型
 */
export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    status?: number;
    data?: unknown;
  };
}
