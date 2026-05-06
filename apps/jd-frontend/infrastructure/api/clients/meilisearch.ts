/**
 * Meilisearch HTTP 客户端
 *
 * 通过统一 API pipeline 访问 Meilisearch 搜索服务。
 */
import { createHttpClient } from '../pipeline/create-client';
import { env } from '@/infrastructure/config/env';

export const meilisearchClient = createHttpClient({
  baseURL: env.MEILISEARCH_HOST ?? '',
  timeout: 10000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    ...(env.MEILISEARCH_API_KEY
      ? { Authorization: `Bearer ${env.MEILISEARCH_API_KEY}` }
      : {}),
  },
});
