import { authenticatedCartRequest } from '@/lib/api/bff/cart-handler';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import type { CartItemsResponse } from '@/lib/api/magento/types';

export async function GET(request: Request) {
  return authenticatedCartRequest(request, accessToken =>
    magentoServerFetch<CartItemsResponse>('/api/cart/items?storeId=1', {
      accessToken,
    })
  );
}
