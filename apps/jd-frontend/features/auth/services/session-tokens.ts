import { randomUUID } from 'crypto';
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

// Refresh Token Rotation: 已使用的 token 集合（内存级，进程重启清空）
// 生产环境应改用 Redis 等持久化存储
const usedRefreshTokens = new Set<string>();

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
  // Refresh Token Rotation: 检测重放攻击
  if (usedRefreshTokens.has(refreshToken)) {
    // 安全告警：已使用的 refresh token 被再次使用，可能是 token 被盗
    // 清空该 session 相关的所有已使用记录（强制重新登录）
    const payload = validateRefreshToken(refreshToken);
    for (const token of usedRefreshTokens) {
      try {
        const p = validateRefreshToken(token);
        if (p.sessionId === payload.sessionId) {
          usedRefreshTokens.delete(token);
        }
      } catch {
        // 忽略无效 token
      }
    }
    throw new Error('Refresh token reused. Session invalidated for security.');
  }

  const payload = validateRefreshToken(refreshToken);

  if (payload.type === 'customer' && !payload.customerEmail) {
    throw new Error('Customer refresh token missing customer email');
  }

  // 标记旧 token 为已使用
  usedRefreshTokens.add(refreshToken);

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
