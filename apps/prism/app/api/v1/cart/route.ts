import { authenticatedCartRequest } from '@/lib/api/bff/cart-rest-handler';
import * as cartRestService from '@/lib/magento/cart-rest.service';

export async function GET(request: Request) {
  return authenticatedCartRequest(
    request,
    async (accessToken, cartId, isGuest) => {
      if (isGuest) {
        return cartRestService.getGuestCart(accessToken, cartId);
      }
      return cartRestService.getCustomerCart(accessToken);
    }
  );
}
