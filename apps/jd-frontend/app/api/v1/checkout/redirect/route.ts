import { NextResponse } from 'next/server';
import { verifyCheckoutRedirectToken } from '@/features/auth/services/checkout-redirect-token';
import { getCartId as getCartIdCookie } from '@/features/auth/services/cookies';
import * as cartRestService from '@/features/cart';
import {
  generateMagentoRedirectToken,
  buildMagentoRedirectUrl,
} from '@/features/auth/services/magento-redirect-token';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');

  if (!token) {
    return NextResponse.json(
      { error: { message: 'Missing checkout redirect token' } },
      { status: 400 }
    );
  }

  try {
    const payload = verifyCheckoutRedirectToken(token);

    if (
      payload.type !== 'checkout_redirect' ||
      payload.returnTo !== 'checkout'
    ) {
      return NextResponse.json(
        { error: { message: 'Invalid checkout redirect token' } },
        { status: 400 }
      );
    }

    if (!payload.magentoAccessToken) {
      return NextResponse.json(
        { error: { message: 'Missing access token' } },
        { status: 400 }
      );
    }

    // 优先从 cookie 读取 cart ID
    let cartId = getCartIdCookie(request) ?? undefined;

    // 没有 cart_id 时按用户类型兜底创建/获取
    if (!cartId && payload.mode === 'guest') {
      cartId = await cartRestService.createGuestCart(
        payload.magentoAccessToken
      );
    }
    if (!cartId && payload.mode === 'customer') {
      cartId = await cartRestService.ensureCustomerCartQuoteId(
        payload.magentoAccessToken
      );
    }

    // 如果还是没有 cart_id，返回错误
    if (!cartId) {
      return NextResponse.json(
        { error: { message: 'No cart available' } },
        { status: 400 }
      );
    }

    // guest 模式下，插件侧会把 cart_id 强转 int，这里需要把 masked id 转成真实 quote id
    const redirectCartId =
      payload.mode === 'guest'
        ? await cartRestService.resolveGuestQuoteId(
            payload.magentoAccessToken,
            cartId
          )
        : cartId;

    // 生成 Magento redirect token
    const magentoToken = generateMagentoRedirectToken({
      ssoUserId: payload.guestId || payload.customerEmail || 'unknown',
      cartId: redirectCartId,
      storeId: 1,
      userType: payload.mode === 'customer' ? 'registered' : 'guest',
      customerEmail: payload.customerEmail,
      tokenType: 'checkout_redirect',
    });

    // 构建 Magento redirect URL
    const redirectUrl = buildMagentoRedirectUrl(
      magentoToken,
      'checkout_redirect'
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Invalid checkout redirect token',
        },
      },
      { status: 400 }
    );
  }
}
