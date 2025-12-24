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
export function isServerSide(): boolean {
  return typeof (globalThis as { window?: unknown }).window === 'undefined';
}

/**
 * 获取 API 基础 URL
 * 直接返回配置的 API URL，不再拼接 /api
 * 接口路径应该以 api/ 开头（如 api/recipes）
 *
 * 如果启用了代理（NEXT_PUBLIC_USE_API_PROXY=true），客户端请求使用代理路径
 */
export function getApiBaseUrl(): string {
  // 如果是客户端且启用了代理，使用代理路径
  if (!isServerSide() && env.NEXT_PUBLIC_USE_API_PROXY) {
    return '/api-proxy';
  }

  const baseUrl = env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is required');
  }

  // 移除末尾的斜杠，统一处理
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
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
