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
  const explicitUrl = process.env.NEXT_PUBLIC_MAGENTO_API_URL;
  if (explicitUrl) {
    return explicitUrl.endsWith('/') ? explicitUrl.slice(0, -1) : explicitUrl;
  }

  const magentoBaseUrl = process.env.NEXT_PUBLIC_MAGENTOL;
  if (!magentoBaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_MAGENTOL is not configured (or explicitly set NEXT_PUBLIC_MAGENTO_API_URL)'
    );
  }

  const parsed = new URL(magentoBaseUrl);
  const protocol = parsed.protocol === 'https:' ? 'http:' : parsed.protocol;
  const inferredApiUrl = `${protocol}//${parsed.hostname}:13000`;
  return inferredApiUrl;
}

interface ServerFetchOptions {
  method?: string;
  body?: string;
  accessToken?: string;
  signal?: AbortSignal;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  return value as Record<string, unknown>;
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
    const jsonRecord = asRecord(json);
    const errorRecord = asRecord(jsonRecord?.error);
    const errMsg =
      (typeof errorRecord?.message === 'string' ? errorRecord.message : null) ??
      (typeof jsonRecord?.message === 'string' ? jsonRecord.message : null) ??
      res.statusText;
    const errCode =
      (typeof errorRecord?.code === 'string' ? errorRecord.code : null) ??
      (typeof jsonRecord?.code === 'string' ? jsonRecord.code : null) ??
      'UNKNOWN';

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
      errorRecord ?? json
    );
  }

  // 兼容两种格式：
  // 1. { success: true, data: T } - 标准 MagentoResponse
  // 2. T - 直接返回数据（OSS 实际格式）
  if (asRecord(json)?.success !== undefined) {
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
