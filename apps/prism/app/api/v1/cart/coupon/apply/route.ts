import { authenticatedCartRequest } from '@/lib/api/bff/cart-rest-handler';
import * as cartRestService from '@/lib/magento/cart-rest.service';

export async function POST(request: Request) {
  const body = (await request.json()) as { couponCode?: string };
  const couponCode = body.couponCode?.trim();

  if (!couponCode) {
    return new Response(
      JSON.stringify({ error: { message: 'Coupon code is required' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return authenticatedCartRequest(
    request,
    async (accessToken, cartId, isGuest) => {
      if (isGuest && cartId) {
        await cartRestService.applyGuestCoupon(accessToken, cartId, couponCode);
        return cartRestService.getGuestCart(accessToken, cartId);
      }
      await cartRestService.applyCustomerCoupon(accessToken, couponCode);
      return cartRestService.getCustomerCart(accessToken);
    }
  );
}
