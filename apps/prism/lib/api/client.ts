import { createLogger } from '../observability/logger';
import type { ClientRequestOptions } from './adapters/client-adapter';
import { clientRequest } from './adapters/client-adapter';
import type { ServerRequestOptions } from './adapters/server-adapter';
import { serverRequest } from './adapters/server-adapter';
import { isDevelopment } from './config';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
  TimeoutError,
} from './errors';

const logger = createLogger('api-client');

/**
 * 请求选项（合并服务端和客户端选项）
 */
type RequestOptions = (ServerRequestOptions | ClientRequestOptions) & {
  skipLogging?: boolean; // 跳过日志记录（敏感请求）
};

/**
 * 统一的 API Client
 */
class ApiClient {
  private get isServer(): boolean {
    return typeof (globalThis as any).window === 'undefined';
  }

  /**
   * 执行请求
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipLogging = false, ...requestOptions } = options;
    const startTime = Date.now();

    // 构建完整 URL（移除开头的 /，统一处理）
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.slice(1)
      : endpoint;

    try {
      // 开发环境日志
      if (!skipLogging && isDevelopment()) {
        logger.debug('API Request', {
          endpoint: cleanEndpoint,
          method: requestOptions.method || 'GET',
          isServer: this.isServer,
        });
      }

      // 根据环境选择适配器
      const response = this.isServer
        ? await serverRequest(
            cleanEndpoint,
            requestOptions as ServerRequestOptions
          )
        : await clientRequest(
            cleanEndpoint,
            requestOptions as ClientRequestOptions
          );

      const duration = Date.now() - startTime;

      // 开发环境日志
      if (!skipLogging && isDevelopment()) {
        logger.debug('API Response', {
          endpoint: cleanEndpoint,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
        });
      }

      // 处理错误响应
      if (!response.ok) {
        await this.handleErrorResponse(response, cleanEndpoint);
      }

      // 解析响应体
      const data = await response.json();
      return data as T;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 错误日志
      if (!skipLogging) {
        logger.error('API Request Failed', {
          endpoint: cleanEndpoint,
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration}ms`,
        });
      }

      // 错误处理
      throw this.handleError(error);
    }
  }

  /**
   * 处理错误响应
   */
  private async handleErrorResponse(
    response: Response,
    endpoint: string
  ): Promise<never> {
    let errorData: unknown;

    try {
      errorData = await response.json();
    } catch {
      try {
        errorData = await response.text();
      } catch {
        errorData = null;
      }
    }

    // 根据状态码抛出不同类型的错误
    switch (response.status) {
      case 401:
        throw new AuthenticationError('Authentication required', errorData);
      case 403:
        throw new AuthorizationError('Permission denied', errorData);
      case 404:
        throw new NotFoundError(`Resource not found: ${endpoint}`, errorData);
      default:
        throw new ApiError(
          `API request failed: ${response.statusText}`,
          response.status,
          undefined,
          errorData
        );
    }
  }

  /**
   * 处理请求错误
   */
  private handleError(error: unknown): Error {
    // 如果已经是 ApiError，直接返回
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      // 超时错误
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return new TimeoutError('Request timeout');
      }

      // 网络错误
      if (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('Failed to fetch')
      ) {
        return new NetworkError('Network error', error);
      }
    }

    return new NetworkError(
      'Unknown error occurred',
      error instanceof Error ? error : new Error(String(error))
    );
  }

  /**
   * GET 请求
   */
  get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST 请求
   */
  post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT 请求
   */
  put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH 请求
   */
  patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE 请求
   */
  delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * 创建 API Client 实例
 */
export function createApiClient(): ApiClient {
  return new ApiClient();
}

/**
 * 默认导出的单例实例
 */
export const apiClient = createApiClient();
