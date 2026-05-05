import { authenticatedCartRequest } from '@/features/cart/cart-rest-handler.bff';
import * as cartRestService from '@/features/cart/cart-rest.service';

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
      if (isGuest) {
        await cartRestService.applyGuestCoupon(accessToken, cartId, couponCode);
        return cartRestService.getGuestCart(accessToken, cartId);
      }
      await cartRestService.applyCustomerCoupon(accessToken, couponCode);
      return cartRestService.getCustomerCart(accessToken);
    }
  );
}
