import { authenticatedCartRequest } from '@/features/cart/cart-rest-handler.bff';
import * as cartRestService from '@/features/cart/cart-rest.service';

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
