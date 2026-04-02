import { authenticatedCartRequest } from '@/lib/api/bff/cart-handler';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import type { CartRedirectResponse } from '@/lib/api/magento/types';

export async function POST(request: Request) {
  return authenticatedCartRequest(request, accessToken =>
    magentoServerFetch<CartRedirectResponse>(
      '/api/cart/checkout-redirect-link',
      {
        method: 'POST',
        body: JSON.stringify({ storeId: 1 }),
        accessToken,
      }
    )
  );
}
