import { getApiBaseUrl } from '../config';

/**
 * 客户端请求选项
 */
export interface ClientRequestOptions extends RequestInit {
  timeout?: number;
}

/**
 * 客户端请求适配器
 * - 开发环境：通过 /api/proxy 路由代理请求（解决跨域）
 * - 生产环境：直接请求后端 API（生产环境已配置 CORS）
 * - 实现超时控制
 * - 统一的请求格式
 */
export async function clientRequest(
  url: string,
  options: ClientRequestOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  // 获取 API 基础 URL
  const baseUrl = getApiBaseUrl();

  // 判断是否使用代理（开发环境使用代理）
  const useProxy = baseUrl === '/api/proxy';

  let requestUrl: string;
  if (useProxy) {
    // 开发环境：使用代理路由
    // 移除 url 开头的 /，因为代理路由会自动处理
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    requestUrl = `/api/proxy/${cleanUrl}`;
  } else {
    // 生产环境：直接请求后端 API
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    requestUrl = `${baseUrl}${cleanUrl}`;
  }

  // 使用 AbortController 实现超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(requestUrl, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...fetchOptions.headers,
      },
    });

    return response;
  } catch (error) {
    // 如果是超时错误，抛出更明确的错误信息
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
