/**
 * Magento/SSO 代理服务独立 HTTP 客户端
 *
 * 与 Strapi 客户端完全独立：
 * - 读取 NEXT_PUBLIC_MAGENTO_API_URL（不共享 Strapi 的 NEXT_PUBLIC_API_URL）
 * - 自动解包 { success, data, error } 三层响应
 * - 支持注入 Bearer accessToken（购物车等需认证接口）
 * - 收到 TOKEN_EXPIRED 时静默刷新 token 并重试一次
 */

import { logRequest } from '../../api/interceptors/request-logger';
import { env } from '../../env';
import type { MagentoResponse } from './types';

// token 刷新回调，由 AuthProvider 在运行时注入
let tokenRefresher: (() => Promise<string | null>) | null = null;
let tokenGetter: (() => string | null) | null = null;

export function setMagentoTokenRefresher(
  getter: () => string | null,
  refresher: () => Promise<string | null>
) {
  tokenGetter = getter;
  tokenRefresher = refresher;
}

function getMagentoBaseUrl(): string {
  // 浏览器端走 Next.js 代理，避免跨域；服务端直连
  if (typeof window !== 'undefined' && env.NEXT_PUBLIC_USE_API_PROXY) {
    return '/magento-proxy';
  }
  const url = env.NEXT_PUBLIC_MAGENTO_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_MAGENTO_API_URL is not configured');
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

interface RequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  /** 传入 accessToken 覆盖自动获取（用于登录流程等特殊场景） */
  accessToken?: string;
  signal?: AbortSignal;
}

async function magentoFetch<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false
): Promise<T> {
  const base = getMagentoBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${cleanPath}`;
  const method = options.method ?? 'GET';
  const startTime = Date.now();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };
  // 有 body 时才设置 Content-Type，否则部分服务端会拒绝空 body + application/json
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // 注入 Bearer token（优先使用显式传入的，否则从 tokenGetter 获取）
  const token = options.accessToken ?? tokenGetter?.();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: options.body,
      signal: options.signal,
    });
  } catch (networkErr) {
    logRequest({
      method,
      url,
      endpoint: cleanPath,
      duration: Date.now() - startTime,
      requestHeaders: headers,
      requestBody: options.body ? tryParseJson(options.body) : undefined,
      error:
        networkErr instanceof Error
          ? networkErr
          : new Error(String(networkErr)),
    });
    throw networkErr;
  }

  const duration = Date.now() - startTime;

  let json: MagentoResponse<T>;
  try {
    json = (await res.json()) as MagentoResponse<T>;
  } catch (parseErr) {
    logRequest({
      method,
      url,
      endpoint: cleanPath,
      status: res.status,
      statusText: res.statusText,
      duration,
      requestHeaders: headers,
      error:
        parseErr instanceof Error ? parseErr : new Error('JSON parse failed'),
    });
    throw parseErr;
  }

  // 处理 TOKEN_EXPIRED：静默刷新后重试一次（不记录日志，避免干扰）
  if (
    res.status === 401 &&
    json.error?.code === 'TOKEN_EXPIRED' &&
    !isRetry &&
    tokenRefresher
  ) {
    const newToken = await tokenRefresher();
    if (newToken) {
      return magentoFetch<T>(path, { ...options, accessToken: newToken }, true);
    }
  }

  // 统一记录请求日志（与 Strapi 客户端格式完全一致）
  logRequest({
    method,
    url,
    endpoint: cleanPath,
    status: res.status,
    statusText: res.statusText,
    duration,
    requestHeaders: headers,
    responseHeaders: res.headers,
    requestBody: options.body ? tryParseJson(options.body) : undefined,
    responseBody: json.data,
  });

  if (!res.ok || !json.success) {
    const errCode = json.error?.code ?? 'UNKNOWN';
    const errMsg = json.error?.message ?? res.statusText;

    if (res.status === 502) {
      throw new MagentoServiceError(
        'Shop service is temporarily unavailable, please try again later',
        'EXTERNAL_SERVICE_ERROR',
        502
      );
    }

    throw new MagentoApiError(errMsg, errCode, res.status, json.error);
  }

  return json.data;
}

function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

export class MagentoApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public detail: unknown = null
  ) {
    super(message);
    this.name = 'MagentoApiError';
  }
}

export class MagentoServiceError extends MagentoApiError {
  constructor(message: string, code: string, status: number) {
    super(message, code, status);
    this.name = 'MagentoServiceError';
  }
}

export const magentoClient = {
  get<T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return magentoFetch<T>(path, { ...opts, method: 'GET' });
  },

  post<T>(path: string, data?: unknown, opts?: Omit<RequestOptions, 'method'>) {
    return magentoFetch<T>(path, {
      ...opts,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },

  put<T>(path: string, data?: unknown, opts?: Omit<RequestOptions, 'method'>) {
    return magentoFetch<T>(path, {
      ...opts,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return magentoFetch<T>(path, { ...opts, method: 'DELETE' });
  },
};
