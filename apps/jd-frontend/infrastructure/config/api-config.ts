import { z } from 'zod';
import { env } from './env';

const apiConfigSchema = z.object({
  baseUrl: z.string(),
  timeout: z.number().min(1000).default(30000),
  retries: z.number().min(0).max(3).default(1),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;
export type Environment = 'development' | 'test' | 'production';

export function isServerSide(): boolean {
  return typeof (globalThis as { window?: unknown }).window === 'undefined';
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getApiBaseUrl(): string {
  if (env.NEXT_PUBLIC_API_URL) {
    return trimTrailingSlash(env.NEXT_PUBLIC_API_URL);
  }

  return isServerSide() ? trimTrailingSlash(env.NEXT_PUBLIC_APP_URL) : '';
}

export function getApiConfig(): ApiConfig {
  return apiConfigSchema.parse({
    baseUrl: getApiBaseUrl(),
    timeout: 30000,
    retries: 1,
  });
}

export function getEnvironment(): Environment {
  if (env.NODE_ENV === 'production') {
    return 'production';
  }

  return env.NODE_ENV === 'test' ? 'test' : 'development';
}

export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

export function isTest(): boolean {
  return getEnvironment() === 'test';
}
