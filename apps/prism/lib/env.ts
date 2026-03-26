import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  STRAPI_API_TOKEN: z.string().optional(), // 服务端专用，不在客户端暴露
  MEILISEARCH_API_KEY: z.string().optional(), // 服务端专用，Meilisearch Admin/Search API Key
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_IMAGE_BASE_URL: z.string().url().optional(), // 图片基础 URL，用于处理相对路径
  NEXT_PUBLIC_LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),
  // 代理配置：如果设置了，客户端请求将通过 Next.js 代理
  NEXT_PUBLIC_USE_API_PROXY: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  // Magento/SSO 服务地址（独立于 Strapi）
  NEXT_PUBLIC_MAGENTO_API_URL: z.string().url().optional(),
  // Meilisearch 服务地址（商品搜索与分类检索）
  NEXT_PUBLIC_MEILISEARCH_HOST: z.string().url().optional(),
});

const mergedSchema = serverSchema.merge(clientSchema);

export const env = mergedSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_IMAGE_BASE_URL: process.env.NEXT_PUBLIC_IMAGE_BASE_URL,
  NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
  NEXT_PUBLIC_USE_API_PROXY: process.env.NEXT_PUBLIC_USE_API_PROXY,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  NEXT_PUBLIC_MAGENTO_API_URL: process.env.NEXT_PUBLIC_MAGENTO_API_URL,
  NEXT_PUBLIC_MEILISEARCH_HOST: process.env.NEXT_PUBLIC_MEILISEARCH_HOST,
  MEILISEARCH_API_KEY: process.env.MEILISEARCH_API_KEY,
  STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN,
});

export const IS_DEVELOPMENT = env.NODE_ENV === 'development';
export const IS_PRODUCTION = env.NODE_ENV === 'production';
export const IS_TEST = env.NODE_ENV === 'test';
