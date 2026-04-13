/**
 * Magento REST API Client (直接调用 Magento，不经过 SSO)
 */

import { MagentoApiError, MagentoServiceError } from '../magento/client';

// 确保 Node.js 接受自签名证书（与 .env.local 中 NODE_TLS_REJECT_UNAUTHORIZED=0 一致）
if (
  typeof process !== 'undefined' &&
  process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0'
) {
  // 已通过环境变量设置
}

function getMagentoRestBaseUrl(): string {
  const magentoBaseUrl = process.env.NEXT_PUBLIC_MAGENTOL;
  if (magentoBaseUrl) {
    return `${magentoBaseUrl.replace(/\/$/, '')}/rest/default/V1`;
  }

  const graphqlUrl = process.env.NEXT_PUBLIC_MAGENTO_GRAPHQL_URL;
  if (!graphqlUrl) {
    throw new Error(
      'NEXT_PUBLIC_MAGENTOL or NEXT_PUBLIC_MAGENTO_GRAPHQL_URL is not configured'
    );
  }

  const url = new URL(graphqlUrl);
  return `${url.protocol}//${url.host}/rest/default/V1`;
}

interface MagentoRestFetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export async function magentoRestFetch<T>(
  path: string,
  options: MagentoRestFetchOptions = {}
): Promise<T> {
  const base = getMagentoRestBaseUrl();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${base}/${cleanPath}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body,
  });

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(`JSON parse failed: ${res.status} ${res.statusText}`);
  }

  if (!res.ok) {
    const errMsg = (json as { message?: string })?.message ?? res.statusText;
    const errCode = 'MAGENTO_REST_ERROR';

    if (res.status === 502) {
      throw new MagentoServiceError(
        'Magento service is temporarily unavailable',
        'EXTERNAL_SERVICE_ERROR',
        502
      );
    }

    throw new MagentoApiError(
      `Magento REST API error: ${errMsg} (status: ${res.status})`,
      errCode,
      res.status,
      json
    );
  }

  return json as T;
}
