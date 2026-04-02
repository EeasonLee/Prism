import { NextResponse } from 'next/server';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import { getGuestId, setAuthCookies } from '@/lib/api/bff/cookies';
import type { AuthResponse } from '@/lib/api/magento/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const guestId = getGuestId(request);

    const data = await magentoServerFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        ...(guestId ? { guestSsoUserId: guestId } : {}),
        storeId: 1,
      }),
    });

    const response = NextResponse.json({
      user: data.user,
      cartMergeStatus: data.cartMergeStatus,
    });

    setAuthCookies(response, data.tokens);
    response.cookies.delete('guest_id');

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Login failed',
        },
      },
      { status: 500 }
    );
  }
}
