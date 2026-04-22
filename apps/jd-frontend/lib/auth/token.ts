import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
import type {
  LocalRefreshTokenPayload,
  LocalSessionTokenPayload,
} from './types';

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getRequiredSecret(secret: string | undefined, name: string): string {
  if (!secret) {
    throw new Error(`${name} is not configured`);
  }

  return secret;
}

export function signHmacToken(payload: object, secret: string): string {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifyHmacToken<T>(token: string, secret: string): T {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    throw new Error('Invalid token format');
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as T & {
    exp?: number;
  };

  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

export function issueLocalAccessToken(
  payload: Omit<LocalSessionTokenPayload, 'iat' | 'exp'>,
  ttlSeconds = DEFAULT_ACCESS_TOKEN_TTL_SECONDS
): string {
  const now = Math.floor(Date.now() / 1000);
  return signHmacToken(
    {
      ...payload,
      iat: now,
      exp: now + ttlSeconds,
    },
    getRequiredSecret(env.AUTH_TOKEN_SECRET, 'AUTH_TOKEN_SECRET')
  );
}

export function issueLocalRefreshToken(
  payload: Omit<LocalRefreshTokenPayload, 'iat' | 'exp'>,
  ttlSeconds = DEFAULT_REFRESH_TOKEN_TTL_SECONDS
): string {
  const now = Math.floor(Date.now() / 1000);
  return signHmacToken(
    {
      ...payload,
      iat: now,
      exp: now + ttlSeconds,
    },
    getRequiredSecret(env.AUTH_TOKEN_SECRET, 'AUTH_TOKEN_SECRET')
  );
}

export function verifyLocalAccessToken(
  token: string
): LocalSessionTokenPayload {
  return verifyHmacToken<LocalSessionTokenPayload>(
    token,
    getRequiredSecret(env.AUTH_TOKEN_SECRET, 'AUTH_TOKEN_SECRET')
  );
}

export function verifyLocalRefreshToken(
  token: string
): LocalRefreshTokenPayload {
  return verifyHmacToken<LocalRefreshTokenPayload>(
    token,
    getRequiredSecret(env.AUTH_TOKEN_SECRET, 'AUTH_TOKEN_SECRET')
  );
}
