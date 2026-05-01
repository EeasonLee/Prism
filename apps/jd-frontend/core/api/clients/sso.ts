/**
 * Magento/SSO 代理 HTTP 客户端
 *
 * 通过 SSO 代理访问 Magento（路径格式 /api/categories/...、/api/products/...），
 * 自动解包 { success, data, error } 响应格式。
 * 同时支持客户端和服务端（不使用 server-only）。
 */
import { createHttpClient } from '../pipeline/create-client';
import type { HttpClient, ReqOptions } from '../pipeline/types';
import { MagentoApiError, MagentoServiceError } from '../errors';
import { env } from '@/lib/env';

function getSsoBaseUrl(): string {
  if (typeof window !== 'undefined' && env.NEXT_PUBLIC_USE_API_PROXY) {
    return '/magento-proxy';
  }
  const url = env.NEXT_PUBLIC_MAGENTO_API_URL ?? env.MAGENTO_URL;
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_MAGENTO_API_URL or MAGENTO_URL is not configured'
    );
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

interface MagentoResponse<T> {
  success: boolean;
  data: T;
  error?: { code?: string; message?: string };
}

const rawClient = createHttpClient({
  baseURL: getSsoBaseUrl(),
  timeout: 15000,
  errorOverrides: (_status, body) => {
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>;
      if (b.success === false && b.error && typeof b.error === 'object') {
        const err = b.error as Record<string, unknown>;
        if (_status === 502) {
          return new MagentoServiceError(
            String(err.message ?? 'Shop service temporarily unavailable')
          );
        }
        return new MagentoApiError(
          String(err.message ?? 'Request failed'),
          String(err.code ?? 'UNKNOWN'),
          _status
        );
      }
    }
    return null;
  },
});

function unwrapResponse<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    const resp = data as MagentoResponse<T>;
    if (resp.success) {
      return resp.data;
    }
  }
  return data as T;
}

export const ssoClient: HttpClient = {
  async get<T>(path: string, opts?: ReqOptions) {
    const result = await rawClient.get<T>(path, opts);
    return unwrapResponse<T>(result);
  },
  async post<T>(path: string, opts?: ReqOptions) {
    const result = await rawClient.post<T>(path, opts);
    return unwrapResponse<T>(result);
  },
  async put<T>(path: string, opts?: ReqOptions) {
    const result = await rawClient.put<T>(path, opts);
    return unwrapResponse<T>(result);
  },
  async patch<T>(path: string, opts?: ReqOptions) {
    const result = await rawClient.patch<T>(path, opts);
    return unwrapResponse<T>(result);
  },
  async delete<T>(path: string, opts?: ReqOptions) {
    const result = await rawClient.delete<T>(path, opts);
    return unwrapResponse<T>(result);
  },
};
