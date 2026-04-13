import { NextResponse } from 'next/server';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import type { AuthResponse } from '@/lib/api/magento/types';
import { env } from '@/lib/env';
import { verifyLocalAccessToken } from './token';
import { clearSession } from './clearSession';
import { getAccessToken, getGuestId, getRefreshToken } from './cookies';
import { renewSessionTokensFromRefreshToken } from './session-tokens';
import { setSession } from './setSession';
import type { SessionResponse, SessionState } from './types';

export function readSessionState(request: Request): SessionState {
  const accessToken = getAccessToken(request);
  const refreshToken = getRefreshToken(request);
  const guestId = getGuestId(request);

  // 本地鉴权模式下，优先信任 access_token 里的用户类型，避免残留 guest_id 误判。
  if (accessToken && env.USE_LOCAL_AUTH) {
    try {
      const payload = verifyLocalAccessToken(accessToken);
      const isGuest = payload.type === 'guest';
      return {
        accessToken,
        refreshToken,
        guestId,
        hasSession: Boolean(accessToken || refreshToken),
        isAuthenticated: !isGuest,
        isGuest,
      };
    } catch {
      // token 无效时回退到 cookie 粗判，后续会在 getSessionResponse 中继续 refresh/清理
    }
  }

  return {
    accessToken,
    refreshToken,
    guestId,
    hasSession: Boolean(accessToken || refreshToken),
    isAuthenticated: Boolean(accessToken) && !guestId,
    isGuest: Boolean(guestId),
  };
}

export async function getSessionResponse(
  request: Request
): Promise<NextResponse<SessionResponse>> {
  const session = readSessionState(request);

  const localCustomerSessionFromToken = (
    accessToken: string
  ): SessionResponse => {
    const payload = verifyLocalAccessToken(accessToken);
    if (payload.type !== 'customer') {
      return {
        hasSession: true,
        isAuthenticated: false,
        isGuest: true,
      };
    }

    const email = payload.customerEmail ?? '';
    return {
      hasSession: true,
      isAuthenticated: true,
      isGuest: false,
      user: {
        id: payload.sub,
        email,
        username: email,
        first_name: '',
        last_name: '',
        email_verified: true,
        active: true,
        role: 'customer',
        created_at: '',
        updated_at: '',
        last_login_at: null,
      },
    };
  };

  if (!session.hasSession) {
    return NextResponse.json<SessionResponse>({
      hasSession: false,
      isAuthenticated: false,
      isGuest: false,
    });
  }

  if (session.isGuest) {
    return NextResponse.json<SessionResponse>({
      hasSession: true,
      isAuthenticated: false,
      isGuest: true,
    });
  }

  if (session.accessToken) {
    try {
      if (env.USE_LOCAL_AUTH) {
        return NextResponse.json<SessionResponse>(
          localCustomerSessionFromToken(session.accessToken)
        );
      }

      const data = await magentoServerFetch<AuthResponse>('/api/auth/me', {
        accessToken: session.accessToken,
      });

      return NextResponse.json<SessionResponse>({
        hasSession: true,
        isAuthenticated: true,
        isGuest: false,
        user: data.user,
      });
    } catch {
      // access_token 过期，继续尝试 refresh_token
    }
  }

  if (session.refreshToken) {
    try {
      if (env.USE_LOCAL_AUTH) {
        const newTokens = await renewSessionTokensFromRefreshToken(
          session.refreshToken
        );
        const response = NextResponse.json<SessionResponse>(
          localCustomerSessionFromToken(newTokens.accessToken)
        );

        return setSession(response, newTokens);
      }

      const data = await magentoServerFetch<AuthResponse>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      const response = NextResponse.json<SessionResponse>({
        hasSession: true,
        isAuthenticated: true,
        isGuest: false,
        user: data.user,
      });

      return setSession(response, data.tokens);
    } catch {
      const response = NextResponse.json<SessionResponse>({
        hasSession: false,
        isAuthenticated: false,
        isGuest: false,
      });

      return clearSession(response);
    }
  }

  return NextResponse.json<SessionResponse>({
    hasSession: false,
    isAuthenticated: false,
    isGuest: false,
  });
}
