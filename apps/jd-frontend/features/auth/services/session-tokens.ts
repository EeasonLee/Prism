import { randomUUID } from 'node:crypto';
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
} from '../types';

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
  // TODO: 安全加固 - 实现 Refresh Token Rotation
  // 当前每次 refresh 只是重新签发新 token 对，旧 refresh token 在
  // 原始 exp 到达前仍可被重复使用。应实现:
  // 1. 每次 refresh 时使旧 refresh token 立即失效
  // 2. 检测到已用过的 refresh token 再次使用时，触发安全告警并
  //    强制登出该用户所有设备
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
  return reissueSessionTokensFromRefreshToken(refreshToken);
}
