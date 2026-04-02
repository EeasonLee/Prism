import { authenticatedCartRequest } from '@/lib/api/bff/cart-handler';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';

export async function DELETE(request: Request) {
  return authenticatedCartRequest(request, accessToken =>
    magentoServerFetch('/api/cart/clear', {
      method: 'DELETE',
      accessToken,
    })
  );
}
