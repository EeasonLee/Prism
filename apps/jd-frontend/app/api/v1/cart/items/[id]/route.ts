import { NextResponse } from 'next/server';
import { authenticatedCartRequest } from '@/features/cart/cart-rest-handler.bff';
import * as cartRestService from '@/features/cart/cart-rest.service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id, 10);

  if (isNaN(itemId) || itemId <= 0) {
    return NextResponse.json(
      { error: { message: 'Invalid item ID' } },
      { status: 400 }
    );
  }

  const body = (await request.json()) as { qty: number };

  return authenticatedCartRequest(
    request,
    async (accessToken, cartId, isGuest) => {
      if (isGuest) {
        return cartRestService.updateGuestCartItem(
          accessToken,
          cartId,
          itemId,
          body.qty
        );
      }
      return cartRestService.updateCustomerCartItem(
        accessToken,
        itemId,
        body.qty
      );
    }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id, 10);

  if (isNaN(itemId) || itemId <= 0) {
    return NextResponse.json(
      { error: { message: 'Invalid item ID' } },
      { status: 400 }
    );
  }

  return authenticatedCartRequest(
    request,
    async (accessToken, cartId, isGuest) => {
      if (isGuest) {
        await cartRestService.removeGuestCartItem(accessToken, cartId, itemId);
      } else {
        await cartRestService.removeCustomerCartItem(accessToken, itemId);
      }
      return {};
    }
  );
}
