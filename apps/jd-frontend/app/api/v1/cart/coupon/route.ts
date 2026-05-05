import { authenticatedCartRequest } from '@/features/cart/cart-rest-handler.bff';
import * as cartRestService from '@/features/cart/cart-rest.service';

export async function DELETE(request: Request) {
  return authenticatedCartRequest(
    request,
    async (accessToken, cartId, isGuest) => {
      if (isGuest) {
        await cartRestService.removeGuestCoupon(accessToken, cartId);
        return cartRestService.getGuestCart(accessToken, cartId);
      }
      await cartRestService.removeCustomerCoupon(accessToken);
      return cartRestService.getCustomerCart(accessToken);
    }
  );
}
