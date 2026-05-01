/**
 * Magento REST API 客户端（直接调用 Magento REST，不经过 SSO）
 */
import { createHttpClient } from '../pipeline/create-client';
import { env } from '@/lib/env';

function getMagentoRestBaseUrl(): string {
  const storeCode = encodeURIComponent(env.MAGENTO_STORE_CODE);
  const baseUrl = (
    env.NEXT_PUBLIC_MAGENTO_API_URL ??
    env.MAGENTO_URL ??
    ''
  ).replace(/\/$/, '');
  return `${baseUrl}/rest/${storeCode}/V1`;
}

export const magentoClient = createHttpClient({
  baseURL: getMagentoRestBaseUrl(),
  timeout: 15000,
  defaultHeaders: { 'Content-Type': 'application/json' },
  retry: { maxRetries: 2, onStatus: [502, 503] },
});
