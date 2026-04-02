import { NextResponse } from 'next/server';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import {
  clearAuthCookies,
  getAccessToken,
  setAuthCookies,
} from '@/lib/api/bff/cookies';
import type { GuestAuthResponse } from '@/lib/api/magento/types';

export async function POST(request: Request) {
  try {
    const accessToken = getAccessToken(request);

    if (accessToken) {
      await magentoServerFetch('/api/auth/logout', {
        method: 'POST',
        accessToken,
      }).catch(() => {
        /* 失败也继续 */
      });
    }

    const guestData = await magentoServerFetch<GuestAuthResponse>(
      '/api/auth/guest',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    setAuthCookies(response, guestData.tokens, guestData.guest_id);

    return response;
  } catch (error) {
    const response = NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Logout failed',
        },
      },
      { status: 500 }
    );
    clearAuthCookies(response);
    return response;
  }
}
