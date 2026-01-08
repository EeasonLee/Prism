/**
 * API 错误类型定义
 */

/**
 * API 错误基类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    // 保持错误堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * 网络错误
 */
export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends Error {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}

/**
 * 认证错误 (401)
 */
export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', data?: unknown) {
    super(message, 401, 'UNAUTHORIZED', data);
    this.name = 'AuthenticationError';
  }
}

/**
 * 权限错误 (403)
 */
export class AuthorizationError extends ApiError {
  constructor(message = 'Permission denied', data?: unknown) {
    super(message, 403, 'FORBIDDEN', data);
    this.name = 'AuthorizationError';
  }
}

/**
 * 资源不存在错误 (404)
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', data?: unknown) {
    super(message, 404, 'NOT_FOUND', data);
    this.name = 'NotFoundError';
  }
}
