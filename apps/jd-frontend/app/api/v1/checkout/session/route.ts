import { NextResponse } from 'next/server';
import { authenticatedCartRequest } from '@/features/cart';
import { issueCheckoutRedirectToken } from '@/features/auth/services/checkout-redirect-token';
import { extractLocalAccessTokenPayload } from '@/features/auth/services/session-tokens';

export async function POST(request: Request) {
  return authenticatedCartRequest(
    request,
    async (magentoAccessToken, _cartId, isGuest) => {
      const accessToken = request.headers
        .get('cookie')
        ?.match(/access_token=([^;]+)/)?.[1];

      if (!accessToken) {
        return NextResponse.json(
          { error: { message: 'Unauthorized' } },
          { status: 401 }
        );
      }

      let guestId: string | undefined;
      let customerEmail: string | undefined;

      try {
        const payload = extractLocalAccessTokenPayload(accessToken);
        if (payload.type === 'guest') {
          guestId = payload.guestId;
        } else {
          customerEmail = payload.customerEmail;
        }
      } catch {
        // Token 解析失败
      }

      const token = issueCheckoutRedirectToken({
        type: 'checkout_redirect',
        mode: isGuest ? 'guest' : 'customer',
        returnTo: 'checkout',
        guestId,
        customerEmail,
        magentoAccessToken,
        sessionAccessToken: accessToken,
      });

      const redirectUrl = `${
        request.headers.get('origin') || 'http://localhost:3010'
      }/api/v1/checkout/redirect?t=${token}`;

      return {
        redirect_url: redirectUrl,
      };
    }
  );
}
