/**
 * 服务端 Magento/OSS 请求工具（BFF 专用，不在浏览器运行）
 *
 * 直连 NEXT_PUBLIC_MAGENTO_API_URL，不走代理。
 * token 由调用方从 Cookie 获取后显式传入，不自动管理 token 生命周期。
 *
 * 兼容两种响应格式：
 * 1. { success: true, data: T } - 标准 MagentoResponse
 * 2. T - 直接返回数据（OSS 实际格式）
 */

import { MagentoApiError, MagentoServiceError } from '../magento/client';
import type { MagentoResponse } from '../magento/types';

function getMagentoBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_MAGENTO_API_URL;
  if (!url) throw new Error('NEXT_PUBLIC_MAGENTO_API_URL is not configured');
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

interface ServerFetchOptions {
  method?: string;
  body?: string;
  accessToken?: string;
  signal?: AbortSignal;
}

export async function magentoServerFetch<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const base = getMagentoBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${cleanPath}`;
  const method = options.method ?? 'GET';

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.accessToken) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body,
    signal: options.signal,
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(`JSON parse failed: ${res.status} ${res.statusText}`);
  }

  // 处理错误响应
  if (!res.ok) {
    const errMsg = json?.error?.message ?? json?.message ?? res.statusText;
    const errCode = json?.error?.code ?? json?.code ?? 'UNKNOWN';

    if (res.status === 502) {
      throw new MagentoServiceError(
        'Shop service is temporarily unavailable, please try again later',
        'EXTERNAL_SERVICE_ERROR',
        502
      );
    }

    throw new MagentoApiError(
      `${errMsg} (status: ${res.status}, code: ${errCode})`,
      errCode,
      res.status,
      json.error ?? json
    );
  }

  // 兼容两种格式：
  // 1. { success: true, data: T } - 标准 MagentoResponse
  // 2. T - 直接返回数据（OSS 实际格式）
  if ('success' in json) {
    const typed = json as MagentoResponse<T>;
    if (!typed.success) {
      const errCode = typed.error?.code ?? 'UNKNOWN';
      const errMsg = typed.error?.message ?? 'Request failed';
      throw new MagentoApiError(
        `${errMsg} (code: ${errCode})`,
        errCode,
        res.status,
        typed.error
      );
    }
    return typed.data;
  }

  // OSS 格式：直接返回数据
  return json as T;
}
