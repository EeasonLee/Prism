/**
 * Strapi 内容 API 客户端
 *
 * 服务端：使用 STRAPI_INTERNAL_URL / STRAPI_URL 直连 Strapi，附带 token 认证
 * 客户端：使用 NEXT_PUBLIC_API_URL 或代理路径
 */
import { createHttpClient } from '../pipeline/create-client';
import { env } from '@/infrastructure/config/env';
import {
  getApiBaseUrl,
  getStrapiServerBaseUrl,
  isServerSide,
} from '@/infrastructure/config/api-config';

const strapiBaseUrl = isServerSide()
  ? getStrapiServerBaseUrl()
  : getApiBaseUrl();

export const strapiClient = createHttpClient({
  baseURL: strapiBaseUrl,
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    ...(isServerSide() && env.STRAPI_API_TOKEN
      ? { token: env.STRAPI_API_TOKEN }
      : {}),
  },
});
