import { z } from 'zod';
import { env } from '../env';

/**
 * API 配置 Schema
 * baseUrl 可以是完整 URL 或相对路径
 */
const apiConfigSchema = z.object({
  baseUrl: z.string().refine(
    val => {
      // 允许完整 URL
      if (val.startsWith('http://') || val.startsWith('https://')) {
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      }
      // 允许相对路径（以 / 开头）
      if (val.startsWith('/')) {
        return true;
      }
      return false;
    },
    {
      message: 'baseUrl must be a valid URL or a relative path starting with /',
    }
  ),
  timeout: z.number().min(1000).default(30000),
  retries: z.number().min(0).max(3).default(1),
});

type ApiConfig = z.infer<typeof apiConfigSchema>;

/**
 * 环境类型
 */
export type Environment = 'development' | 'test' | 'production';

/**
 * 判断是否在服务端运行
 */
function isServerSide(): boolean {
  return typeof (globalThis as any).window === 'undefined';
}

/**
 * 获取 API 基础 URL
 * - 服务端：直接使用后端地址（无跨域问题）
 * - 客户端：使用代理路由（解决跨域）
 */
export function getApiBaseUrl(): string {
  if (isServerSide()) {
    // 服务端：直接请求后端
    const baseUrl = env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_API_URL is required on server side');
    }
    // 确保 URL 以 /api 结尾
    if (baseUrl.endsWith('/api')) {
      return baseUrl;
    }
    if (baseUrl.endsWith('/')) {
      return `${baseUrl}api`;
    }
    return `${baseUrl}/api`;
  }

  // 客户端：使用代理路由
  return '/api/proxy';
}

/**
 * 获取 API 配置
 */
export function getApiConfig(): ApiConfig {
  const baseUrl = getApiBaseUrl();
  return apiConfigSchema.parse({
    baseUrl,
    timeout: 30000,
    retries: 1,
  });
}

/**
 * 判断当前环境
 */
export function getEnvironment(): Environment {
  return env.NODE_ENV === 'production'
    ? 'production'
    : env.NODE_ENV === 'test'
    ? 'test'
    : 'development';
}

/**
 * 是否为开发环境
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * 是否为生产环境
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

/**
 * 是否为测试环境
 */
export function isTest(): boolean {
  return getEnvironment() === 'test';
}
