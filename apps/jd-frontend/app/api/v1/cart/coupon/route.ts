import { authenticatedCartRequest } from '@/lib/api/bff/cart-rest-handler';
import * as cartRestService from '@/lib/magento/cart-rest.service';

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
