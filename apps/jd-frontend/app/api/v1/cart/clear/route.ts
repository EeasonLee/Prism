import { authenticatedCartRequest } from '@/lib/api/bff/cart-rest-handler';
import * as cartRestService from '@/lib/magento/cart-rest.service';

export async function DELETE(request: Request) {
  return authenticatedCartRequest(
    request,
    async (accessToken, cartId, isGuest) => {
      if (isGuest) {
        await cartRestService.clearGuestCart(accessToken, cartId);
      } else {
        await cartRestService.clearCustomerCart(accessToken);
      }
      return {};
    }
  );
}
