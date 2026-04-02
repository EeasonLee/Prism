import { NextResponse } from 'next/server';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import { setAuthCookies } from '@/lib/api/bff/cookies';
import type { GuestAuthResponse } from '@/lib/api/magento/types';

export async function POST() {
  try {
    const data = await magentoServerFetch<GuestAuthResponse>(
      '/api/auth/guest',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = NextResponse.json({ hasSession: true });
    setAuthCookies(response, data.tokens, data.guest_id);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Guest login failed',
        },
      },
      { status: 500 }
    );
  }
}
