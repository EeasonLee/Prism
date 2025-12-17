import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  STRAPI_API_TOKEN: z.string().optional(), // 服务端专用，不在客户端暴露
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),
});

const mergedSchema = serverSchema.merge(clientSchema);

export const env = mergedSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
  STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN,
});

export const IS_DEVELOPMENT = env.NODE_ENV === 'development';
export const IS_PRODUCTION = env.NODE_ENV === 'production';
export const IS_TEST = env.NODE_ENV === 'test';

// 只在开发环境打印环境变量信息
if (IS_DEVELOPMENT) {
  console.log('【当前环境】:', env.NODE_ENV);
  console.log('【当前接口地址】:', env.NEXT_PUBLIC_API_URL);
  if (env.STRAPI_API_TOKEN) {
    console.log(
      '【API Token】: 已配置 (长度:',
      env.STRAPI_API_TOKEN.length,
      ', 前10字符:',
      env.STRAPI_API_TOKEN.substring(0, 10) + '...)'
    );
  } else {
    console.warn('【API Token】: ⚠️  未配置！服务端请求可能失败');
  }
}
