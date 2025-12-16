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
 * - 模拟浏览器请求头
 */
export async function serverRequest(
  url: string,
  options: ServerRequestOptions = {}
): Promise<Response> {
  const { next, ...fetchOptions } = options;

  // 构建完整的 URL
  // 如果 url 已经是完整 URL，直接使用；否则拼接 baseUrl
  const baseUrl = getApiBaseUrl();
  const fullUrl = url.startsWith('http')
    ? url
    : url.startsWith('/')
    ? `${baseUrl}${url}`
    : `${baseUrl}/${url}`;

  // 准备请求头
  const headers = new Headers(fetchOptions.headers);

  // 设置基础请求头
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json, text/plain, */*');

  // 模拟浏览器请求头（避免被后端拦截）
  headers.set(
    'User-Agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  headers.set('Accept-Language', 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7');
  headers.set('Accept-Encoding', 'gzip, deflate, br');
  headers.set('Cache-Control', 'no-cache');
  headers.set('Pragma', 'no-cache');

  // 设置 Referer 和 Origin 为后端地址
  const apiBaseUrl = env.NEXT_PUBLIC_API_URL || '';
  headers.set('Referer', apiBaseUrl);
  headers.set('Origin', apiBaseUrl);
  headers.set('Sec-Fetch-Dest', 'empty');
  headers.set('Sec-Fetch-Mode', 'cors');
  headers.set('Sec-Fetch-Site', 'same-origin');

  // 添加认证 token（服务端专用，不会暴露到客户端）
  if (env.STRAPI_API_TOKEN) {
    headers.set('token', env.STRAPI_API_TOKEN);
  }

  // 执行请求
  return fetch(fullUrl, {
    ...fetchOptions,
    headers,
    next, // Next.js 缓存配置
  });
}
