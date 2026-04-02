import { NextResponse } from 'next/server';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import { getRefreshToken, setAuthCookies } from '@/lib/api/bff/cookies';
import type { AuthResponse } from '@/lib/api/magento/types';

export async function POST(request: Request) {
  try {
    const refreshToken = getRefreshToken(request);
    if (!refreshToken) {
      return NextResponse.json(
        { error: { message: 'No refresh token' } },
        { status: 401 }
      );
    }

    const data = await magentoServerFetch<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    const response = NextResponse.json({ success: true });
    setAuthCookies(response, data.tokens);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Token refresh failed',
        },
      },
      { status: 500 }
    );
  }
}
