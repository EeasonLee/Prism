import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  NotFoundError,
  TimeoutError,
} from '@prism/shared';
import type { ClientRequestOptions } from './adapters/client-adapter';
import { clientRequest } from './adapters/client-adapter';
import type { ServerRequestOptions } from './adapters/server-adapter';
import { serverRequest } from './adapters/server-adapter';
import { getApiBaseUrl, isServerSide } from './config';
import { logRequest } from './interceptors/request-logger';

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
    return isServerSide();
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

    // 构建完整 URL（用于日志显示）
    const baseUrl = getApiBaseUrl();
    const fullUrl = `${baseUrl}/${cleanEndpoint}`;

    // 解析请求体（用于日志）
    let requestBody: unknown;
    if (requestOptions.body) {
      try {
        requestBody = JSON.parse(requestOptions.body as string);
      } catch {
        requestBody = requestOptions.body;
      }
    }

    try {
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

      // 先解析响应体（Response body 只能读取一次）
      let data: T;
      try {
        data = await response.json();
      } catch {
        // 如果不是 JSON，尝试作为文本处理
        try {
          const text = await response.text();
          throw new Error(
            `Response is not valid JSON: ${text.substring(0, 100)}`
          );
        } catch {
          throw new Error('Failed to parse response body');
        }
      }

      // 统一日志记录（所有响应都记录响应体，包括成功和错误）
      if (!skipLogging) {
        logRequest({
          method: requestOptions.method || 'GET',
          url: fullUrl,
          endpoint: cleanEndpoint,
          status: response.status,
          statusText: response.statusText,
          duration,
          requestHeaders: requestOptions.headers
            ? requestOptions.headers instanceof Headers
              ? requestOptions.headers
              : typeof requestOptions.headers === 'object' &&
                !Array.isArray(requestOptions.headers)
              ? (requestOptions.headers as Record<string, string>)
              : undefined
            : undefined,
          responseHeaders: response.headers,
          requestBody,
          responseBody: data, // 所有响应都传递响应体数据
        });
      }

      // 处理错误响应（在解析响应体之后检查）
      if (!response.ok) {
        await this.handleErrorResponse(response, cleanEndpoint, data);
      }

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 统一错误日志记录
      if (!skipLogging) {
        logRequest({
          method: requestOptions.method || 'GET',
          url: fullUrl,
          endpoint: cleanEndpoint,
          duration,
          requestHeaders: requestOptions.headers
            ? requestOptions.headers instanceof Headers
              ? requestOptions.headers
              : typeof requestOptions.headers === 'object' &&
                !Array.isArray(requestOptions.headers)
              ? (requestOptions.headers as Record<string, string>)
              : undefined
            : undefined,
          requestBody,
          error: error instanceof Error ? error : String(error),
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
    endpoint: string,
    errorData?: unknown
  ): Promise<never> {
    // 如果已经解析了响应体，直接使用；否则尝试解析
    if (errorData === undefined) {
      try {
        errorData = await response.json();
      } catch {
        // JSON 解析失败，尝试获取文本
        try {
          errorData = await response.text();
        } catch {
          // 无法获取响应体，使用 null
          errorData = null;
        }
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
