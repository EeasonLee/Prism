import { env } from '../../env';
import { getApiBaseUrl } from '../config';

/**
 * 服务端请求选项（扩展 Next.js fetch 选项）
 */
export interface ServerRequestOptions extends RequestInit {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

/**
 * 服务端请求适配器
 * - 直接使用 fetch 请求后端 API（无跨域问题）
 * - 支持 Next.js 缓存配置
 * - 自动添加认证 token
 */
export async function serverRequest(
  url: string,
  options: ServerRequestOptions = {}
): Promise<Response> {
  const { next, ...fetchOptions } = options;

  // 构建完整的 URL
  // url 应该以 api/ 开头（如 api/recipes）
  const baseUrl = getApiBaseUrl();
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}/${cleanUrl}`;

  // 准备请求头
  const headers = new Headers(fetchOptions.headers);

  // 设置基础请求头
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  // 添加认证 token（服务端专用，不会暴露到客户端）
  if (env.STRAPI_API_TOKEN) {
    headers.set('token', env.STRAPI_API_TOKEN);
  }

  // 执行请求
  try {
    return await fetch(fullUrl, {
      ...fetchOptions,
      headers,
      next, // Next.js 缓存配置
    });
  } catch (error) {
    // 开发环境：提供更详细的错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error('[Server Request Failed]', {
        baseUrl,
        url,
        fullUrl,
        apiUrl: env.NEXT_PUBLIC_API_URL,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}
