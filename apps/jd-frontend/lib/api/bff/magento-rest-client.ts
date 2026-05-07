/**
 * Magento REST API Client (直接调用 Magento，不经过 SSO)
 */

import { MagentoApiError, MagentoServiceError } from '../magento/client';
import { env } from '@/lib/env';

// 确保 Node.js 接受自签名证书（与 .env.local 中 NODE_TLS_REJECT_UNAUTHORIZED=0 一致）
if (
  typeof process !== 'undefined' &&
  process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0'
) {
  // 已通过环境变量设置
}

function getMagentoRestBaseUrl(): string {
  const storeCode = encodeURIComponent(env.MAGENTO_STORE_CODE);
  const magentoBaseUrl = process.env.MAGENTO_URL;
  if (magentoBaseUrl) {
    return `${magentoBaseUrl.replace(/\/$/, '')}/rest/${storeCode}/V1`;
  }

  const graphqlUrl = process.env.NEXT_PUBLIC_MAGENTO_GRAPHQL_URL;
  if (!graphqlUrl) {
    throw new Error(
      'MAGENTO_URL or NEXT_PUBLIC_MAGENTO_GRAPHQL_URL is not configured'
    );
  }

  const url = new URL(graphqlUrl);
  return `${url.protocol}//${url.host}/rest/${storeCode}/V1`;
}

interface MagentoRestFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

function shouldLogMagentoRestDebug(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.DEBUG_MAGENTO_REST === 'true'
  );
}

function summarizeBody(body: string | undefined): string | undefined {
  if (!body) {
    return undefined;
  }
  const normalized = body.replace(/\s+/g, ' ').trim();
  return normalized.length > 500
    ? `${normalized.slice(0, 500)}...`
    : normalized;
}

export async function magentoRestFetch<T>(
  path: string,
  options: MagentoRestFetchOptions = {}
): Promise<T> {
  const base = getMagentoRestBaseUrl();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${base}/${cleanPath}`;
  const method = options.method ?? 'GET';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: options.body,
    });
  } catch (error) {
    if (shouldLogMagentoRestDebug()) {
      console.error('[Magento REST request failed]', {
        method,
        url,
        requestBody: summarizeBody(options.body),
        error: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(`JSON parse failed: ${res.status} ${res.statusText}`);
  }

  if (!res.ok) {
    const errMsg = (json as { message?: string })?.message ?? res.statusText;
    const errCode = 'MAGENTO_REST_ERROR';
    if (shouldLogMagentoRestDebug()) {
      console.error('[Magento REST response error]', {
        method,
        url,
        status: res.status,
        statusText: res.statusText,
        requestBody: summarizeBody(options.body),
        responseBody: json,
      });
    }

    if (res.status === 502) {
      throw new MagentoServiceError(
        'Magento service is temporarily unavailable',
        'EXTERNAL_SERVICE_ERROR',
        502
      );
    }

    // 优惠券 404 错误改为人性化提示
    if (res.status === 404 && url.includes('/coupons/')) {
      throw new MagentoApiError(
        'The coupon code is not valid. Please check and try again.',
        'COUPON_NOT_FOUND',
        404,
        json
      );
    }

    throw new MagentoApiError(
      `Magento REST API error: ${errMsg} (status: ${res.status}, ${method} ${url})`,
      errCode,
      res.status,
      json
    );
  }

  return json as T;
}
