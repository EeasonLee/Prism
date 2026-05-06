import { env } from '@/infrastructure/config/env';
import type { CheckoutRedirectTokenPayload } from '../types';
import { signHmacToken, verifyHmacToken } from './token';

const DEFAULT_CHECKOUT_REDIRECT_TOKEN_TTL_SECONDS = 10 * 60;

function getRequiredSecret(secret: string | undefined): string {
  if (!secret) {
    throw new Error('AUTH_TOKEN_SECRET is not configured');
  }

  return secret;
}

export function issueCheckoutRedirectToken(
  payload: Omit<CheckoutRedirectTokenPayload, 'iat' | 'exp'>,
  ttlSeconds = DEFAULT_CHECKOUT_REDIRECT_TOKEN_TTL_SECONDS
): string {
  const now = Math.floor(Date.now() / 1000);

  return signHmacToken(
    {
      ...payload,
      iat: now,
      exp: now + ttlSeconds,
    },
    getRequiredSecret(env.AUTH_TOKEN_SECRET)
  );
}

export function verifyCheckoutRedirectToken(
  token: string
): CheckoutRedirectTokenPayload {
  return verifyHmacToken<CheckoutRedirectTokenPayload>(
    token,
    getRequiredSecret(env.AUTH_TOKEN_SECRET)
  );
}
