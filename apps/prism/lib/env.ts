import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
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
});
