import { authenticatedCartRequest } from '@/lib/api/bff/cart-rest-handler';
import type { AddCartItemParams } from '@/lib/api/magento/types';
import * as cartRestService from '@/lib/magento/cart-rest.service';

export async function POST(request: Request) {
  const body = (await request.json()) as AddCartItemParams;

  return authenticatedCartRequest(
    request,
    async (accessToken, cartId, isGuest) => {
      if (isGuest) {
        await cartRestService.addGuestCartItem(accessToken, cartId, body);
        // 返回完整 cart（包含 totals）
        return cartRestService.getGuestCart(accessToken, cartId);
      }
      await cartRestService.addCustomerCartItem(accessToken, body);
      return cartRestService.getCustomerCart(accessToken);
    }
  );
}
