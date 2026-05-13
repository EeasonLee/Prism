import { authenticatedCartRequest } from '@/features/cart';
import * as cartRestService from '@/features/cart';

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
