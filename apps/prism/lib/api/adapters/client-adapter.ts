/**
 * 客户端请求选项
 */
export interface ClientRequestOptions extends RequestInit {
  timeout?: number;
}

/**
 * 客户端请求适配器
 * - 通过 /api/proxy 路由代理请求（解决跨域）
 * - 实现超时控制
 * - 统一的请求格式
 */
export async function clientRequest(
  url: string,
  options: ClientRequestOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  // 客户端统一使用代理路由
  // 移除 url 开头的 /，因为代理路由会自动处理
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const proxyUrl = `/api/proxy/${cleanUrl}`;

  // 使用 AbortController 实现超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(proxyUrl, {
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
