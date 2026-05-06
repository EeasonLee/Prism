import { authenticatedCartRequest } from '@/features/cart';
import * as cartRestService from '@/features/cart';

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
