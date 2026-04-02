import { authenticatedCartRequest } from '@/lib/api/bff/cart-handler';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import type { CartItem } from '@/lib/api/magento/types';

export async function POST(request: Request) {
  const body = await request.json();
  return authenticatedCartRequest(request, accessToken =>
    magentoServerFetch<CartItem>('/api/cart/items/add', {
      method: 'POST',
      body: JSON.stringify(body),
      accessToken,
    })
  );
}
