/**
 * Magento 服务端直连客户端（仅服务端，不走 SSO 代理）
 */
import 'server-only';

import { createHttpClient } from '../pipeline/create-client';
import { env } from '@/core/config/env';

export const magentoServerClient = createHttpClient({
  baseURL: env.MAGENTO_URL ?? '',
  timeout: 15000,
  retry: { maxRetries: 2, onStatus: [502, 503] },
});
