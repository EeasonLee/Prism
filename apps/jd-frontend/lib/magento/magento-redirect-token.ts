/**
 * Magento Redirect Token Generator
 *
 * 生成 Magento 期望的 redirect JWT token，用于 sso/cart/redirect 和 sso/checkout/redirect
 */

import { createHmac } from 'node:crypto';
import { env } from '@/lib/env';

const TOKEN_LIFETIME = 600; // 10 minutes

interface MagentoRedirectTokenPayload {
  sso_user_id: string;
  cart_id: string;
  store_id: number;
  user_type: 'guest' | 'registered';
  email?: string;
  iat: number;
  exp: number;
  type: 'cart_redirect' | 'checkout_redirect';
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateHS256JWT(
  payload: MagentoRedirectTokenPayload,
  secret: string
): string {
  const header = {
    typ: 'JWT',
    alg: 'HS256',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export interface GenerateMagentoRedirectTokenParams {
  ssoUserId: string;
  cartId: string;
  storeId: number;
  userType: 'guest' | 'registered';
  customerEmail?: string;
  tokenType: 'cart_redirect' | 'checkout_redirect';
}

export function generateMagentoRedirectToken(
  params: GenerateMagentoRedirectTokenParams
): string {
  const secret = env.MAGENTO_JWT_SECRET;
  if (!secret) {
    throw new Error('MAGENTO_JWT_SECRET is not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: MagentoRedirectTokenPayload = {
    sso_user_id: params.ssoUserId,
    cart_id: params.cartId,
    store_id: params.storeId,
    user_type: params.userType,
    iat: now,
    exp: now + TOKEN_LIFETIME,
    type: params.tokenType,
  };

  // 只有 registered 用户才包含 email
  if (params.userType === 'registered' && params.customerEmail) {
    payload.email = params.customerEmail;
  }

  return generateHS256JWT(payload, secret);
}

export function buildMagentoRedirectUrl(
  token: string,
  tokenType: 'cart_redirect' | 'checkout_redirect'
): string {
  const magentoBaseUrl =
    env.MAGENTO_URL ??
    env.NEXT_PUBLIC_MAGENTO_GRAPHQL_URL?.replace(/\/graphql$/, '');
  if (!magentoBaseUrl) {
    throw new Error(
      'MAGENTO_URL or NEXT_PUBLIC_MAGENTO_GRAPHQL_URL is not configured'
    );
  }

  const path =
    tokenType === 'checkout_redirect'
      ? 'sso/checkout/redirect'
      : 'sso/cart/redirect';
  return `${magentoBaseUrl}/${path}?t=${encodeURIComponent(token)}`;
}
