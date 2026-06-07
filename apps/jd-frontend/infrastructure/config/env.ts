import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3090'),
  NEXT_PUBLIC_API_URL: z
    .preprocess(
      value =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
      z
        .string()
        .refine(
          value =>
            value.startsWith('http://') ||
            value.startsWith('https://') ||
            value.startsWith('/'),
          {
            message:
              'NEXT_PUBLIC_API_URL must be an absolute URL or a relative path starting with /',
          }
        )
        .optional()
    )
    .optional(),
  NEXT_PUBLIC_IMAGE_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  DISCORD_ALERT_WEBHOOK_URL: z.string().url().optional(),
  NOTIFY_CHANNEL: z.enum(['discord', 'wecom']).default('discord'),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_IMAGE_BASE_URL: process.env.NEXT_PUBLIC_IMAGE_BASE_URL,
  NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
  NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  DISCORD_ALERT_WEBHOOK_URL: process.env.DISCORD_ALERT_WEBHOOK_URL,
  NOTIFY_CHANNEL: process.env.NOTIFY_CHANNEL,
});

export const IS_DEVELOPMENT = env.NODE_ENV === 'development';
export const IS_PRODUCTION = env.NODE_ENV === 'production';
export const IS_TEST = env.NODE_ENV === 'test';
