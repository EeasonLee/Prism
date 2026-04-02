import { authenticatedCartRequest } from '@/lib/api/bff/cart-handler';
import { magentoServerFetch } from '@/lib/api/bff/magento-server';
import type { CartItem } from '@/lib/api/magento/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  return authenticatedCartRequest(request, accessToken =>
    magentoServerFetch<CartItem>(`/api/cart/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      accessToken,
    })
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return authenticatedCartRequest(request, accessToken =>
    magentoServerFetch(`/api/cart/items/${id}`, {
      method: 'DELETE',
      accessToken,
    })
  );
}
