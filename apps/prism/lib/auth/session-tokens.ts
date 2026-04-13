import { randomUUID } from 'node:crypto';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import type { AuthResponse } from '@/lib/api/magento/types';
import {
  issueLocalAccessToken,
  issueLocalRefreshToken,
  verifyLocalAccessToken,
  verifyLocalRefreshToken,
} from './token';
import type {
  LocalRefreshTokenPayload,
  LocalSessionTokenPayload,
  LocalSessionTokens,
} from './types';

interface IssueCustomerSessionTokensInput {
  customerId: string;
  customerEmail: string;
  magentoAccessToken: string;
  magentoRefreshToken?: string;
  guestId?: string;
  sessionId?: string;
}

interface IssueGuestSessionTokensInput {
  guestId: string;
  magentoAccessToken: string;
  magentoRefreshToken?: string;
  sessionId?: string;
}

function createSessionId(sessionId?: string): string {
  return sessionId ?? randomUUID();
}

export function issueCustomerSessionTokens(
  input: IssueCustomerSessionTokensInput
): LocalSessionTokens {
  const sessionId = createSessionId(input.sessionId);

  return {
    accessToken: issueLocalAccessToken({
      sub: input.customerId,
      type: 'customer',
      magentoAccessToken: input.magentoAccessToken,
      customerEmail: input.customerEmail,
      guestId: input.guestId,
    }),
    refreshToken: issueLocalRefreshToken({
      sub: input.customerId,
      sessionId,
      type: 'customer',
      guestId: input.guestId,
      magentoAccessToken: input.magentoAccessToken,
      magentoRefreshToken: input.magentoRefreshToken,
      customerEmail: input.customerEmail,
    }),
  };
}

export function issueGuestSessionTokens(
  input: IssueGuestSessionTokensInput
): LocalSessionTokens {
  const sessionId = createSessionId(input.sessionId);

  return {
    accessToken: issueLocalAccessToken({
      sub: input.guestId,
      type: 'guest',
      magentoAccessToken: input.magentoAccessToken,
      guestId: input.guestId,
    }),
    refreshToken: issueLocalRefreshToken({
      sub: input.guestId,
      sessionId,
      type: 'guest',
      guestId: input.guestId,
      magentoAccessToken: input.magentoAccessToken,
      magentoRefreshToken: input.magentoRefreshToken,
    }),
  };
}

export function extractLocalAccessTokenPayload(
  accessToken: string
): LocalSessionTokenPayload {
  return verifyLocalAccessToken(accessToken);
}

export function extractWrappedMagentoAccessToken(accessToken: string): string {
  return extractLocalAccessTokenPayload(accessToken).magentoAccessToken;
}

export function validateRefreshToken(
  refreshToken: string
): LocalRefreshTokenPayload {
  return verifyLocalRefreshToken(refreshToken);
}

export function reissueSessionTokensFromRefreshToken(
  refreshToken: string
): LocalSessionTokens {
  const payload = validateRefreshToken(refreshToken);

  if (payload.type === 'customer' && !payload.customerEmail) {
    throw new Error('Customer refresh token missing customer email');
  }

  return payload.type === 'customer'
    ? issueCustomerSessionTokens({
        customerId: payload.sub,
        customerEmail: payload.customerEmail ?? '',
        magentoAccessToken: payload.magentoAccessToken,
        magentoRefreshToken: payload.magentoRefreshToken,
        guestId: payload.guestId,
        sessionId: payload.sessionId,
      })
    : issueGuestSessionTokens({
        guestId: payload.guestId ?? payload.sub,
        magentoAccessToken: payload.magentoAccessToken,
        magentoRefreshToken: payload.magentoRefreshToken,
        sessionId: payload.sessionId,
      });
}

export async function renewSessionTokensFromRefreshToken(
  refreshToken: string
): Promise<LocalSessionTokens> {
  const payload = validateRefreshToken(refreshToken);

  if (!payload.magentoRefreshToken) {
    return reissueSessionTokensFromRefreshToken(refreshToken);
  }

  try {
    const refreshed = await magentoServerFetch<AuthResponse>(
      '/api/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: payload.magentoRefreshToken }),
      }
    );

    if (payload.type === 'customer') {
      return issueCustomerSessionTokens({
        customerId: payload.sub,
        customerEmail: payload.customerEmail ?? refreshed.user.email,
        magentoAccessToken: refreshed.tokens.accessToken,
        magentoRefreshToken: refreshed.tokens.refreshToken,
        guestId: payload.guestId,
        sessionId: payload.sessionId,
      });
    }

    return issueGuestSessionTokens({
      guestId: payload.guestId ?? payload.sub,
      magentoAccessToken: refreshed.tokens.accessToken,
      magentoRefreshToken: refreshed.tokens.refreshToken,
      sessionId: payload.sessionId,
    });
  } catch {
    // 上游 refresh 失败时兜底保留旧行为，避免直接把用户踢下线。
    return reissueSessionTokensFromRefreshToken(refreshToken);
  }
}
