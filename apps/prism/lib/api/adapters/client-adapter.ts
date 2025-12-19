import { getApiBaseUrl } from '../config';
import { logRequest } from '../interceptors';

/**
 * 客户端请求选项
 */
export interface ClientRequestOptions extends RequestInit {
  timeout?: number;
}

/**
 * 构建请求头
 */
function buildHeaders(
  customHeaders?: RequestInit['headers']
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // 合并自定义请求头
  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  return headers;
}

/**
 * 客户端请求适配器
 * - 直接请求后端 API（需要后端配置 CORS）
 * - 实现超时控制
 * - 统一的请求格式
 */
export async function clientRequest(
  url: string,
  options: ClientRequestOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;
  const startTime = Date.now();

  const baseUrl = getApiBaseUrl();

  // 构建完整 URL
  // url 应该以 api/ 开头（如 api/recipes）
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const fullUrl = `${baseUrl}/${cleanUrl}`;

  // 构建请求头
  const headers = buildHeaders(fetchOptions.headers);

  // 记录请求体（用于日志）
  let requestBody: unknown;
  if (fetchOptions.body) {
    try {
      requestBody = JSON.parse(fetchOptions.body as string);
    } catch {
      requestBody = fetchOptions.body;
    }
  }

  // 使用 AbortController 实现超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      signal: controller.signal,
      headers,
    });

    const duration = Date.now() - startTime;

    // 记录响应体（用于日志）
    const responseClone = response.clone();
    let responseBody: unknown;
    try {
      responseBody = await responseClone.json();
    } catch {
      // 如果不是 JSON，忽略
    }

    // 在浏览器控制台显示请求日志（仅开发环境）

    if (
      typeof (globalThis as { window?: unknown }).window !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      logRequest({
        method: fetchOptions.method || 'GET',
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
        duration,
        requestHeaders: headers,
        responseHeaders: response.headers,
        requestBody,
        responseBody,
      });
    }

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    // 在浏览器控制台显示错误日志（仅开发环境）

    if (
      typeof (globalThis as { window?: unknown }).window !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      logRequest({
        method: fetchOptions.method || 'GET',
        url: fullUrl,
        duration,
        requestHeaders: headers,
        requestBody,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    // 如果是超时错误，抛出更明确的错误信息
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
